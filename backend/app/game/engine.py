"""Game engine: scenario selection, HP/score calculation, session management."""
import uuid
from datetime import UTC, datetime

from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.auth.models import User
from app.auth.service import compute_league
from app.game.models import GameSession, Scenario, UserChoice
from app.game.schemas import AnswerResponse, ScenarioResponse, StartSessionResponse

HP_CORRECT = 10
HP_WRONG = -20
SCORE_BASE = 100
SCORE_SPEED_BONUS = 50  # if answered in < 10 sec
SCORE_STREAK_BONUS = 25  # per consecutive correct, cumulative max x3
SCENARIOS_PER_SESSION = 5
CERT_MIN_HP = 1  # any HP > 0 earns cert


def _strip_correct(options: list[dict]) -> list[dict]:
    return [{"id": o["id"], "text": o["text"]} for o in options]


def _scenario_to_response(s: Scenario) -> ScenarioResponse:
    return ScenarioResponse(
        scenario_id=str(s.id),
        location=s.location,
        attack_type=s.attack_type,
        cwe_id=s.cwe_id,
        owasp_category=s.owasp_category,
        scenario_text=s.scenario_text,
        answer_options=_strip_correct(s.answer_options),
    )


async def pick_scenarios(db: AsyncSession, location: str, count: int = SCENARIOS_PER_SESSION) -> list[Scenario]:
    result = await db.execute(
        select(Scenario)
        .where(Scenario.location == location, Scenario.is_published == True)  # noqa: E712
        .order_by(func.random())
        .limit(count)
    )
    return list(result.scalars().all())


async def start_session(db: AsyncSession, user: User, location: str) -> StartSessionResponse:
    scenarios = await pick_scenarios(db, location)
    if not scenarios:
        # Fallback: try any location if requested location has no scenarios yet
        scenarios = await pick_scenarios(db, "office")

    session = GameSession(
        user_id=user.id,
        location=location,
        hp_start=100,
        scenarios_count=len(scenarios),
    )
    db.add(session)
    await db.flush()

    # Store scenario queue in session metadata (simplified: return first, track via choices)
    # We'll use a Redis-based approach in production; here we encode order in session id namespace
    await db.commit()
    await db.refresh(session)

    return StartSessionResponse(
        session_id=str(session.id),
        hp=100,
        scenarios_count=len(scenarios),
        first_scenario=_scenario_to_response(scenarios[0]),
    )


async def process_answer(
    db: AsyncSession,
    user: User,
    session_id: str,
    scenario_id: str,
    chosen_answer_id: str,
    answer_time_seconds: float | None,
) -> AnswerResponse:
    # Load session
    sess_result = await db.execute(
        select(GameSession).where(GameSession.id == session_id, GameSession.user_id == user.id)
    )
    session = sess_result.scalar_one_or_none()
    if not session or session.completed:
        from fastapi import HTTPException
        raise HTTPException(status_code=404, detail="Сессия не найдена или завершена")

    # Load scenario
    sc_result = await db.execute(select(Scenario).where(Scenario.id == scenario_id))
    scenario = sc_result.scalar_one_or_none()
    if not scenario:
        from fastapi import HTTPException
        raise HTTPException(status_code=404, detail="Сценарий не найден")

    is_correct = scenario.correct_answer_id == chosen_answer_id

    # Calculate HP delta
    hp_delta = HP_CORRECT if is_correct else HP_WRONG
    new_hp = max(0, min(100, user.hp + hp_delta))

    # Calculate score
    score_delta = 0
    if is_correct:
        score_delta = SCORE_BASE
        if answer_time_seconds and answer_time_seconds < 10:
            score_delta += SCORE_SPEED_BONUS

    # Streak
    choices_result = await db.execute(
        select(UserChoice)
        .where(UserChoice.session_id == session_id)
        .order_by(UserChoice.chosen_at.desc())
        .limit(3)
    )
    recent = list(choices_result.scalars().all())
    streak = 0
    for c in recent:
        if c.is_correct:
            streak += 1
        else:
            break
    if is_correct:
        streak_bonus_multiplier = min(streak, 3)
        score_delta += SCORE_STREAK_BONUS * streak_bonus_multiplier
        streak += 1
    else:
        streak = 0

    # Persist choice
    choice = UserChoice(
        session_id=session_id,
        scenario_id=scenario_id,
        chosen_answer_id=chosen_answer_id,
        is_correct=is_correct,
        hp_delta=hp_delta,
        score_delta=score_delta,
    )
    db.add(choice)

    # Update user HP and score
    user.hp = new_hp
    user.total_score += score_delta
    old_league = user.league
    user.league = compute_league(user.total_score)

    # Update session
    session.correct_count += 1 if is_correct else 0
    session.score_earned += score_delta

    # Check if session complete
    answered_count = len(recent) + 1
    session_complete = answered_count >= session.scenarios_count

    await db.commit()

    # Pick next scenario if not complete
    next_scenario = None
    if not session_complete:
        already_answered = [str(c.scenario_id) for c in recent] + [scenario_id]
        next_result = await db.execute(
            select(Scenario)
            .where(
                Scenario.location == session.location,
                Scenario.is_published == True,  # noqa: E712
                Scenario.id.not_in([uuid.UUID(sid) for sid in already_answered]),
            )
            .order_by(func.random())
            .limit(1)
        )
        next_sc = next_result.scalar_one_or_none()
        if next_sc:
            next_scenario = _scenario_to_response(next_sc)

    return AnswerResponse(
        is_correct=is_correct,
        hp_new=new_hp,
        hp_delta=hp_delta,
        score_delta=score_delta,
        total_score=user.total_score,
        explanation=scenario.explanation_correct if is_correct else scenario.explanation_wrong,
        animation_type="success" if is_correct else "hack_animation",
        next_scenario=next_scenario,
        session_complete=session_complete,
        streak=streak,
    )


async def complete_session(db: AsyncSession, user: User, session_id: str):
    sess_result = await db.execute(
        select(GameSession).where(GameSession.id == session_id, GameSession.user_id == user.id)
    )
    session = sess_result.scalar_one_or_none()
    if not session:
        from fastapi import HTTPException
        raise HTTPException(status_code=404, detail="Сессия не найдена")

    # Count answers
    choices_result = await db.execute(
        select(UserChoice).where(UserChoice.session_id == session_id)
    )
    choices = list(choices_result.scalars().all())
    total = len(choices)
    correct = sum(1 for c in choices if c.is_correct)
    accuracy = round((correct / total * 100) if total > 0 else 0)

    old_league = user.league
    session.completed = True
    session.hp_end = user.hp
    session.finished_at = datetime.now(UTC)
    await db.commit()

    new_league = compute_league(user.total_score)
    league_changed = new_league != old_league

    return {
        "final_hp": user.hp,
        "final_score": session.score_earned,
        "accuracy_percent": accuracy,
        "league_new": new_league,
        "league_changed": league_changed,
        "session": session,
        "can_cert": user.hp >= CERT_MIN_HP,
    }
