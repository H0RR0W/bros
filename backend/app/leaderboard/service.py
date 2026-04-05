"""Redis Sorted Set based leaderboard."""
import json

import redis.asyncio as aioredis

from app.auth.models import User
from app.config import settings

LEADERBOARD_KEY = "leaderboard:global"
USER_META_PREFIX = "user_meta:"

_redis: aioredis.Redis | None = None


def get_redis() -> aioredis.Redis:
    global _redis
    if _redis is None:
        _redis = aioredis.from_url(settings.REDIS_URL, decode_responses=True)
    return _redis


async def update_leaderboard(user: User) -> None:
    r = get_redis()
    await r.zadd(LEADERBOARD_KEY, {str(user.id): user.total_score})
    # Store user display meta
    await r.hset(
        f"{USER_META_PREFIX}{user.id}",
        mapping={"username": user.username, "league": user.league},
    )


async def get_top(limit: int = 50, offset: int = 0) -> list[dict]:
    r = get_redis()
    entries = await r.zrevrange(LEADERBOARD_KEY, offset, offset + limit - 1, withscores=True)
    result = []
    for rank_idx, (user_id, score) in enumerate(entries):
        meta = await r.hgetall(f"{USER_META_PREFIX}{user_id}")
        result.append(
            {
                "rank": offset + rank_idx + 1,
                "user_id": user_id,
                "username": meta.get("username", "unknown"),
                "total_score": int(score),
                "league": meta.get("league", "Новичок"),
            }
        )
    return result


async def get_user_rank(user: User) -> dict:
    r = get_redis()
    rank = await r.zrevrank(LEADERBOARD_KEY, str(user.id))
    total = await r.zcard(LEADERBOARD_KEY)
    if rank is None:
        return {"rank": None, "total_score": user.total_score, "league": user.league, "percentile": None}
    percentile = round((1 - rank / total) * 100, 1) if total > 0 else 100.0
    return {
        "rank": rank + 1,
        "total_score": user.total_score,
        "league": user.league,
        "percentile": percentile,
    }
