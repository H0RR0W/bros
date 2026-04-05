from fastapi import APIRouter, Depends, Query

from app.auth.models import User
from app.dependencies import get_current_user
from app.leaderboard.service import get_top, get_user_rank

router = APIRouter(prefix="/leaderboard", tags=["leaderboard"])


@router.get("")
async def leaderboard(
    limit: int = Query(50, ge=1, le=200),
    league: str | None = Query(None),
):
    entries = await get_top(limit=limit)
    if league:
        entries = [e for e in entries if e["league"] == league]
    return entries


@router.get("/me")
async def my_rank(current_user: User = Depends(get_current_user)):
    return await get_user_rank(current_user)
