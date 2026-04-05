from datetime import UTC, datetime, timedelta

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.admin.models import AdminLog
from app.admin.schemas import (
    AdminLogListResponse,
    AdminLogItem,
    AdminStatsResponse,
    AdminUserItem,
    AdminUserListResponse,
    PublishRequest,
    RoleUpdateRequest,
    ScenarioCreateRequest,
    ScenarioUpdateRequest,
    StatusUpdateRequest,
    UserEditRequest,
)
from app.auth.models import User
from app.database import get_db
from app.dependencies import require_admin
from app.game.models import GameSession, Scenario, UserChoice


async def _log(db: AsyncSession, admin: User, action: str, target_id: str | None = None, details: str | None = None):
    entry = AdminLog(
        admin_id=admin.id,
        admin_username=admin.username,
        action=action,
        target_id=target_id,
        details=details,
    )
    db.add(entry)
    # commit is done by the calling endpoint

router = APIRouter(prefix="/admin", tags=["admin"])


# ─── Users ───────────────────────────────────────────────────────────────────
@router.get("/users", response_model=AdminUserListResponse)
async def list_users(
    page: int = Query(1, ge=1),
    limit: int = Query(50, ge=1, le=200),
    search: str | None = Query(None),
    db: AsyncSession = Depends(get_db),
    admin: User = Depends(require_admin),
):
    query = select(User)
    if search:
        query = query.where(
            User.email.ilike(f"%{search}%") | User.username.ilike(f"%{search}%")
        )

    total_result = await db.execute(select(func.count()).select_from(query.subquery()))
    total = total_result.scalar() or 0

    result = await db.execute(
        query.order_by(User.created_at.desc()).offset((page - 1) * limit).limit(limit)
    )
    users = list(result.scalars().all())

    return AdminUserListResponse(
        users=[
            AdminUserItem(
                id=str(u.id),
                email=u.email,
                username=u.username,
                role=u.role,
                league=u.league,
                total_score=u.total_score,
                is_active=u.is_active,
                created_at=u.created_at.strftime("%Y-%m-%d"),
            )
            for u in users
        ],
        total=total,
    )


@router.delete("/users/{user_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_user(
    user_id: str,
    db: AsyncSession = Depends(get_db),
    admin: User = Depends(require_admin),
):
    if str(admin.id) == user_id:
        raise HTTPException(status_code=400, detail="Нельзя удалить самого себя")
    result = await db.execute(select(User).where(User.id == user_id))
    user = result.scalar_one_or_none()
    if not user:
        raise HTTPException(status_code=404, detail="Пользователь не найден")
    await _log(db, admin, "delete_user", user_id, f"username={user.username}")
    await db.delete(user)
    await db.commit()


@router.patch("/users/{user_id}/edit", status_code=200)
async def edit_user(
    user_id: str,
    body: UserEditRequest,
    db: AsyncSession = Depends(get_db),
    admin: User = Depends(require_admin),
):
    result = await db.execute(select(User).where(User.id == user_id))
    user = result.scalar_one_or_none()
    if not user:
        raise HTTPException(status_code=404, detail="Пользователь не найден")
    changed = []
    for field, value in body.model_dump(exclude_none=True).items():
        setattr(user, field, value)
        changed.append(field)
    await _log(db, admin, "edit_user", user_id, f"fields={','.join(changed)}")
    await db.commit()
    return {"id": user_id}


@router.patch("/users/{user_id}/role", status_code=200)
async def update_user_role(
    user_id: str,
    body: RoleUpdateRequest,
    db: AsyncSession = Depends(get_db),
    admin: User = Depends(require_admin),
):
    if body.role not in ("user", "admin"):
        raise HTTPException(status_code=400, detail="Неверная роль")
    result = await db.execute(select(User).where(User.id == user_id))
    user = result.scalar_one_or_none()
    if not user:
        raise HTTPException(status_code=404, detail="Пользователь не найден")
    user.role = body.role
    await _log(db, admin, "update_role", user_id, f"role={body.role}")
    await db.commit()
    return {"id": user_id, "role": body.role}


@router.patch("/users/{user_id}/status", status_code=200)
async def update_user_status(
    user_id: str,
    body: StatusUpdateRequest,
    db: AsyncSession = Depends(get_db),
    admin: User = Depends(require_admin),
):
    result = await db.execute(select(User).where(User.id == user_id))
    user = result.scalar_one_or_none()
    if not user:
        raise HTTPException(status_code=404, detail="Пользователь не найден")
    user.is_active = body.is_active
    await _log(db, admin, "update_status", user_id, f"is_active={body.is_active}")
    await db.commit()
    return {"id": user_id, "is_active": body.is_active}


# ─── Scenarios ───────────────────────────────────────────────────────────────
@router.get("/scenarios")
async def list_scenarios(
    location: str | None = Query(None),
    attack_type: str | None = Query(None),
    published: bool | None = Query(None),
    page: int = Query(1, ge=1),
    limit: int = Query(50, ge=1, le=200),
    db: AsyncSession = Depends(get_db),
    admin: User = Depends(require_admin),
):
    query = select(Scenario)
    if location:
        query = query.where(Scenario.location == location)
    if attack_type:
        query = query.where(Scenario.attack_type == attack_type)
    if published is not None:
        query = query.where(Scenario.is_published == published)

    total_result = await db.execute(select(func.count()).select_from(query.subquery()))
    total = total_result.scalar() or 0

    result = await db.execute(
        query.order_by(Scenario.created_at.desc()).offset((page - 1) * limit).limit(limit)
    )
    scenarios = list(result.scalars().all())

    return {
        "scenarios": [
            {
                "id": str(s.id),
                "location": s.location,
                "attack_type": s.attack_type,
                "cwe_id": s.cwe_id,
                "owasp_category": s.owasp_category,
                "is_ai_generated": s.is_ai_generated,
                "is_published": s.is_published,
                "created_at": s.created_at.strftime("%Y-%m-%d"),
            }
            for s in scenarios
        ],
        "total": total,
    }


@router.post("/scenarios", status_code=status.HTTP_201_CREATED)
async def create_scenario(
    body: ScenarioCreateRequest,
    db: AsyncSession = Depends(get_db),
    admin: User = Depends(require_admin),
):
    scenario = Scenario(
        location=body.location,
        attack_type=body.attack_type,
        cwe_id=body.cwe_id,
        owasp_category=body.owasp_category,
        scenario_text=body.scenario_text,
        answer_options=body.answer_options,
        correct_answer_id=body.correct_answer_id,
        explanation_wrong=body.explanation_wrong,
        explanation_correct=body.explanation_correct,
        is_ai_generated=False,
        is_published=True,
        created_by=admin.id,
    )
    db.add(scenario)
    await db.commit()
    await db.refresh(scenario)
    return {"scenario_id": str(scenario.id)}


@router.put("/scenarios/{scenario_id}")
async def update_scenario(
    scenario_id: str,
    body: ScenarioUpdateRequest,
    db: AsyncSession = Depends(get_db),
    admin: User = Depends(require_admin),
):
    result = await db.execute(select(Scenario).where(Scenario.id == scenario_id))
    scenario = result.scalar_one_or_none()
    if not scenario:
        raise HTTPException(status_code=404, detail="Сценарий не найден")

    for field, value in body.model_dump(exclude_none=True).items():
        setattr(scenario, field, value)

    await db.commit()
    return {"scenario_id": scenario_id}


@router.patch("/scenarios/{scenario_id}/publish")
async def publish_scenario(
    scenario_id: str,
    body: PublishRequest,
    db: AsyncSession = Depends(get_db),
    admin: User = Depends(require_admin),
):
    result = await db.execute(select(Scenario).where(Scenario.id == scenario_id))
    scenario = result.scalar_one_or_none()
    if not scenario:
        raise HTTPException(status_code=404, detail="Сценарий не найден")
    scenario.is_published = body.is_published
    await db.commit()
    return {"id": scenario_id, "is_published": body.is_published}


@router.delete("/scenarios/{scenario_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_scenario(
    scenario_id: str,
    db: AsyncSession = Depends(get_db),
    admin: User = Depends(require_admin),
):
    result = await db.execute(select(Scenario).where(Scenario.id == scenario_id))
    scenario = result.scalar_one_or_none()
    if not scenario:
        raise HTTPException(status_code=404, detail="Сценарий не найден")
    await db.delete(scenario)
    await db.commit()


# ─── Stats ────────────────────────────────────────────────────────────────────
@router.get("/stats", response_model=AdminStatsResponse)
async def admin_stats(
    db: AsyncSession = Depends(get_db),
    admin: User = Depends(require_admin),
):
    total_users_result = await db.execute(select(func.count()).select_from(User))
    total_users = total_users_result.scalar() or 0

    week_ago = datetime.now(UTC) - timedelta(days=7)
    active_result = await db.execute(
        select(func.count(func.distinct(GameSession.user_id)))
        .where(GameSession.started_at >= week_ago)
    )
    active_users_7d = active_result.scalar() or 0

    sessions_result = await db.execute(select(func.count()).select_from(GameSession))
    total_sessions = sessions_result.scalar() or 0

    # Average accuracy
    choices_result = await db.execute(select(func.count()).select_from(UserChoice))
    total_choices = choices_result.scalar() or 0
    correct_result = await db.execute(
        select(func.count()).where(UserChoice.is_correct == True)  # noqa: E712
    )
    total_correct = correct_result.scalar() or 0
    avg_accuracy = round(total_correct / total_choices * 100, 1) if total_choices > 0 else 0.0

    # Scenarios by location
    loc_result = await db.execute(
        select(Scenario.location, func.count()).group_by(Scenario.location)
    )
    scenarios_by_location = {row[0]: row[1] for row in loc_result.all()}

    # Scenarios by attack type
    type_result = await db.execute(
        select(Scenario.attack_type, func.count()).group_by(Scenario.attack_type)
    )
    scenarios_by_type = {row[0]: row[1] for row in type_result.all()}

    return AdminStatsResponse(
        total_users=total_users,
        active_users_7d=active_users_7d,
        total_sessions=total_sessions,
        avg_accuracy=avg_accuracy,
        scenarios_by_location=scenarios_by_location,
        scenarios_by_type=scenarios_by_type,
    )


# ─── Admin Logs ───────────────────────────────────────────────────────────────
@router.get("/logs", response_model=AdminLogListResponse)
async def get_admin_logs(
    page: int = Query(1, ge=1),
    limit: int = Query(50, ge=1, le=200),
    db: AsyncSession = Depends(get_db),
    admin: User = Depends(require_admin),
):
    query = select(AdminLog)
    total_result = await db.execute(select(func.count()).select_from(AdminLog))
    total = total_result.scalar() or 0

    result = await db.execute(
        query.order_by(AdminLog.created_at.desc()).offset((page - 1) * limit).limit(limit)
    )
    logs = list(result.scalars().all())

    return AdminLogListResponse(
        logs=[
            AdminLogItem(
                id=str(l.id),
                admin_id=str(l.admin_id),
                admin_username=l.admin_username,
                action=l.action,
                target_id=l.target_id,
                details=l.details,
                created_at=l.created_at.strftime("%Y-%m-%d %H:%M:%S"),
            )
            for l in logs
        ],
        total=total,
    )
