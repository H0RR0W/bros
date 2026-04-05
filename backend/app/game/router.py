from datetime import UTC, datetime

from fastapi import APIRouter, Depends, HTTPException, Query
from pydantic import BaseModel
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.auth.models import User
from app.auth.service import compute_league
from app.database import get_db
from app.dependencies import get_current_user
from app.game import engine
from app.game.models import GameSession, Scenario
from app.game.schemas import (
    AnswerRequest,
    AnswerResponse,
    CompleteSessionRequest,
    CompleteSessionResponse,
    ScenarioResponse,
    StartSessionRequest,
    StartSessionResponse,
)

router = APIRouter(tags=["game"])


class SubmitResultRequest(BaseModel):
    location: str          # office | home | wifi
    steps_count: int       # total steps played
    correct_count: int     # how many were correct
    hp_delta: int          # net HP change (may be negative)
    score: int             # score earned in this session


class SubmitResultResponse(BaseModel):
    hp_new: int
    total_score: int
    league: str
    league_changed: bool


@router.post("/game/submit-result", response_model=SubmitResultResponse)
async def submit_result(
    body: SubmitResultRequest,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    if body.location not in ("office", "home", "wifi"):
        raise HTTPException(status_code=400, detail="Неверная локация")

    hp_new = max(0, min(100, current_user.hp + body.hp_delta))
    old_league = current_user.league

    # Create completed session record
    session = GameSession(
        user_id=current_user.id,
        location=body.location,
        hp_start=current_user.hp,
        hp_end=hp_new,
        score_earned=max(0, body.score),
        scenarios_count=body.steps_count,
        correct_count=max(0, body.correct_count),
        completed=True,
        finished_at=datetime.now(UTC),
    )
    db.add(session)

    # Update user
    current_user.hp = hp_new
    current_user.total_score += max(0, body.score)
    current_user.league = compute_league(current_user.total_score)

    await db.commit()

    try:
        from app.leaderboard.service import update_leaderboard
        await update_leaderboard(current_user)
    except Exception:
        pass

    return SubmitResultResponse(
        hp_new=hp_new,
        total_score=current_user.total_score,
        league=current_user.league,
        league_changed=current_user.league != old_league,
    )


AI_LOCATIONS = [
    "корпоративный офис крупного банка",
    "домашняя сеть сотрудника",
    "публичное Wi-Fi кафе",
    "мобильное устройство",
    "торговый центр",
    "банкомат и терминал оплаты",
    "удалённая работа из отеля",
]

AI_ATTACK_TYPES = [
    "phishing", "bec", "social-engineering", "credential_stuffing",
    "vishing", "deepfake", "mitm", "evil_twin", "password", "smishing",
    "qr_phishing", "fake_app",
]


class AIScenarioResponse(BaseModel):
    scenario_id: str
    attack_type: str
    cwe_id: str
    owasp_category: str
    scenario_text: str
    answer_options: list  # [{id, text, is_correct}]
    correct_answer_id: str
    explanation_wrong: str
    explanation_correct: str


@router.get("/game/ai-generate", response_model=AIScenarioResponse)
async def ai_generate(
    attack_type: str = Query(..., description="Attack type from ATTACK_META"),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Generate a fresh AI scenario for the given attack type using Mistral."""
    import random as _random
    from app.ai.generator import generate_or_get_scenario

    if attack_type not in AI_ATTACK_TYPES:
        raise HTTPException(status_code=400, detail=f"Неизвестный тип атаки: {attack_type}")

    location = _random.choice(AI_LOCATIONS)
    try:
        scenario = await generate_or_get_scenario(db, location, attack_type)
    except Exception as exc:
        raise HTTPException(status_code=503, detail=f"AI генерация недоступна: {exc}")

    return AIScenarioResponse(
        scenario_id=str(scenario.id),
        attack_type=scenario.attack_type,
        cwe_id=scenario.cwe_id,
        owasp_category=scenario.owasp_category,
        scenario_text=scenario.scenario_text,
        answer_options=scenario.answer_options,
        correct_answer_id=scenario.correct_answer_id,
        explanation_wrong=scenario.explanation_wrong,
        explanation_correct=scenario.explanation_correct,
    )


@router.get("/scenarios/{location}", response_model=ScenarioResponse)
async def get_scenario(
    location: str,
    attack_type: str | None = Query(None),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    query = select(Scenario).where(
        Scenario.location == location,
        Scenario.is_published == True,  # noqa: E712
    )
    if attack_type:
        query = query.where(Scenario.attack_type == attack_type)
    query = query.order_by(func.random()).limit(1)

    result = await db.execute(query)
    scenario = result.scalar_one_or_none()

    if not scenario:
        # Try AI generation via generator module
        try:
            from app.ai.generator import generate_or_get_scenario
            scenario = await generate_or_get_scenario(db, location, attack_type or "phishing")
        except Exception:
            raise HTTPException(status_code=503, detail="Сценарий временно недоступен")

    return ScenarioResponse(
        scenario_id=str(scenario.id),
        location=scenario.location,
        attack_type=scenario.attack_type,
        cwe_id=scenario.cwe_id,
        owasp_category=scenario.owasp_category,
        scenario_text=scenario.scenario_text,
        answer_options=[{"id": o["id"], "text": o["text"]} for o in scenario.answer_options],
    )


@router.post("/game/start", response_model=StartSessionResponse)
async def start_game(
    body: StartSessionRequest,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    if body.location not in ("office", "home", "wifi"):
        raise HTTPException(status_code=400, detail="Неверная локация")
    return await engine.start_session(db, current_user, body.location)


@router.post("/game/answer", response_model=AnswerResponse)
async def answer(
    body: AnswerRequest,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return await engine.process_answer(
        db,
        current_user,
        body.session_id,
        body.scenario_id,
        body.chosen_answer_id,
        body.answer_time_seconds,
    )


@router.post("/game/complete", response_model=CompleteSessionResponse)
async def complete_game(
    body: CompleteSessionRequest,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    result = await engine.complete_session(db, current_user, body.session_id)

    cert_id = None
    if result["can_cert"]:
        from app.certificates.service import issue_certificate
        cert = await issue_certificate(
            db,
            current_user,
            result["session"],
            result["accuracy_percent"],
        )
        cert_id = str(cert.id)

    # Update leaderboard
    try:
        from app.leaderboard.service import update_leaderboard
        await update_leaderboard(current_user)
    except Exception:
        pass

    return CompleteSessionResponse(
        final_hp=result["final_hp"],
        final_score=result["final_score"],
        accuracy_percent=result["accuracy_percent"],
        league_new=result["league_new"],
        league_changed=result["league_changed"],
        certificate_id=cert_id,
    )
