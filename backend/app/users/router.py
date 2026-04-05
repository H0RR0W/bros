from fastapi import APIRouter, Depends, Query
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.auth.models import User
from app.certificates.models import Certificate
from app.database import get_db
from app.dependencies import get_current_user
from app.game.models import GameSession, UserChoice
from app.users.schemas import SessionHistoryItem, SessionHistoryResponse, UserStats

router = APIRouter(prefix="/users", tags=["users"])


@router.get("/me/stats", response_model=UserStats)
async def get_my_stats(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    # Aggregate choices
    choices_result = await db.execute(
        select(UserChoice)
        .join(GameSession, UserChoice.session_id == GameSession.id)
        .where(GameSession.user_id == current_user.id)
    )
    choices = list(choices_result.scalars().all())

    total_answers = len(choices)
    total_correct = sum(1 for c in choices if c.is_correct)

    # Sessions count (completed)
    sessions_result = await db.execute(
        select(func.count()).where(
            GameSession.user_id == current_user.id,
            GameSession.completed == True,  # noqa: E712
        )
    )
    total_sessions = sessions_result.scalar() or 0

    # Fallback: aggregate accuracy from session records when no UserChoice rows exist
    if total_answers == 0:
        agg_result = await db.execute(
            select(
                func.coalesce(func.sum(GameSession.correct_count), 0),
                func.coalesce(func.sum(GameSession.scenarios_count), 0),
            ).where(
                GameSession.user_id == current_user.id,
                GameSession.completed == True,  # noqa: E712
            )
        )
        row = agg_result.one_or_none()
        if row:
            total_correct = int(row[0] or 0)
            total_answers = int(row[1] or 0)

    accuracy = round(total_correct / total_answers * 100, 1) if total_answers > 0 else 0.0

    # Attacks by type — join through scenario
    from app.game.models import Scenario
    type_result = await db.execute(
        select(Scenario.attack_type, func.count())
        .join(UserChoice, UserChoice.scenario_id == Scenario.id)
        .join(GameSession, UserChoice.session_id == GameSession.id)
        .where(GameSession.user_id == current_user.id)
        .group_by(Scenario.attack_type)
    )
    attacks_by_type = {row[0]: row[1] for row in type_result.all()}

    return UserStats(
        total_sessions=total_sessions,
        total_correct=total_correct,
        total_answers=total_answers,
        accuracy_percent=accuracy,
        attacks_by_type=attacks_by_type,
    )


@router.get("/me/history", response_model=SessionHistoryResponse)
async def get_my_history(
    page: int = Query(1, ge=1),
    limit: int = Query(20, ge=1, le=100),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    offset = (page - 1) * limit

    total_result = await db.execute(
        select(func.count()).where(GameSession.user_id == current_user.id, GameSession.completed == True)  # noqa: E712
    )
    total = total_result.scalar() or 0

    sessions_result = await db.execute(
        select(GameSession)
        .where(GameSession.user_id == current_user.id, GameSession.completed == True)  # noqa: E712
        .order_by(GameSession.finished_at.desc())
        .offset(offset)
        .limit(limit)
    )
    sessions = list(sessions_result.scalars().all())

    items = []
    for s in sessions:
        accuracy = round(s.correct_count / s.scenarios_count * 100) if s.scenarios_count > 0 else 0
        items.append(
            SessionHistoryItem(
                id=str(s.id),
                location=s.location,
                score=s.score_earned,
                accuracy=accuracy,
                correct_count=s.correct_count,
                scenarios_count=s.scenarios_count,
                date=s.finished_at.strftime("%Y-%m-%d") if s.finished_at else "",
            )
        )

    return SessionHistoryResponse(sessions=items, total=total)


@router.get("/me/certificates")
async def get_my_certificates(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    result = await db.execute(
        select(Certificate)
        .where(Certificate.user_id == current_user.id)
        .order_by(Certificate.issued_at.desc())
    )
    certs = list(result.scalars().all())
    return [
        {
            "id": str(c.id),
            "location": c.location,
            "score": c.final_score,
            "accuracy": c.accuracy_percent,
            "verification_code": c.verification_code,
            "issued_at": c.issued_at.isoformat(),
            "is_valid": c.is_valid,
        }
        for c in certs
    ]
