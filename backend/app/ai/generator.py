"""AI scenario generation: Redis cache → DeepSeek → DB fallback → hardcoded fallback."""
import hashlib
import json
import logging
import random

import redis.asyncio as aioredis
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.ai.mistral import call_mistral
from app.ai.fallback import FALLBACK_SCENARIOS
from app.ai.prompts import ATTACK_META, SYSTEM_PROMPT, build_prompt
from app.config import settings
from app.game.models import Scenario

logger = logging.getLogger(__name__)

_redis_client: aioredis.Redis | None = None


def get_redis() -> aioredis.Redis:
    global _redis_client
    if _redis_client is None:
        _redis_client = aioredis.from_url(settings.REDIS_URL, decode_responses=True)
    return _redis_client


def _cache_key(location: str, attack_type: str) -> str:
    slug = hashlib.md5(f"{location}:{attack_type}".encode()).hexdigest()[:12]
    return f"scenario:{location}:{attack_type}:{slug}"


async def generate_or_get_scenario(db: AsyncSession, location: str, attack_type: str) -> Scenario:
    redis = get_redis()
    cache_key = _cache_key(location, attack_type)

    # 1. Check Redis cache
    try:
        cached = await redis.get(cache_key)
        if cached:
            data = json.loads(cached)
            return _dict_to_scenario(data, location, attack_type, is_ai=True)
    except Exception as e:
        logger.warning("Redis cache read failed: %s", e)

    # 2. Try DB (non-AI, published)
    try:
        result = await db.execute(
            select(Scenario)
            .where(
                Scenario.location == location,
                Scenario.attack_type == attack_type,
                Scenario.is_published == True,  # noqa: E712
                Scenario.is_ai_generated == False,  # noqa: E712
            )
            .order_by(func.random())
            .limit(1)
        )
        scenario = result.scalar_one_or_none()
        if scenario:
            return scenario
    except Exception as e:
        logger.warning("DB scenario lookup failed: %s", e)

    # 3. Try DeepSeek
    try:
        prompt = build_prompt(location, attack_type)
        data = await call_mistral(SYSTEM_PROMPT, prompt)
        _validate_scenario_data(data)

        # Save to DB
        meta = ATTACK_META.get(attack_type, {"cwe_id": "CWE-1021", "owasp_category": "A03"})
        scenario = Scenario(
            location=location,
            attack_type=attack_type,
            cwe_id=meta["cwe_id"],
            owasp_category=meta["owasp_category"],
            scenario_text=data["scenario_text"],
            answer_options=data["answer_options"],
            correct_answer_id=data["correct_answer_id"],
            explanation_wrong=data["explanation_wrong"],
            explanation_correct=data["explanation_correct"],
            is_ai_generated=True,
            is_published=True,
        )
        db.add(scenario)
        await db.commit()
        await db.refresh(scenario)

        # Cache in Redis
        try:
            await redis.setex(cache_key, settings.SCENARIO_CACHE_TTL, json.dumps(data))
        except Exception:
            pass

        return scenario
    except Exception as e:
        logger.warning("DeepSeek generation failed: %s", e)

    # 4. Hardcoded fallback
    candidates = [s for s in FALLBACK_SCENARIOS if s["location"] == location]
    if not candidates:
        candidates = FALLBACK_SCENARIOS
    data = random.choice(candidates)
    return _dict_to_scenario(data, location, attack_type, is_ai=False)


def _dict_to_scenario(data: dict, location: str, attack_type: str, is_ai: bool) -> Scenario:
    meta = ATTACK_META.get(attack_type, {"cwe_id": "CWE-1021", "owasp_category": "A03"})
    return Scenario(
        location=data.get("location", location),
        attack_type=data.get("attack_type", attack_type),
        cwe_id=data.get("cwe_id", meta["cwe_id"]),
        owasp_category=data.get("owasp_category", meta["owasp_category"]),
        scenario_text=data["scenario_text"],
        answer_options=data["answer_options"],
        correct_answer_id=data["correct_answer_id"],
        explanation_wrong=data["explanation_wrong"],
        explanation_correct=data["explanation_correct"],
        is_ai_generated=is_ai,
        is_published=True,
    )


def _validate_scenario_data(data: dict) -> None:
    required = ["scenario_text", "answer_options", "correct_answer_id", "explanation_wrong", "explanation_correct"]
    for field in required:
        if field not in data:
            raise ValueError(f"Missing field: {field}")
    if len(data["answer_options"]) != 4:
        raise ValueError("Must have exactly 4 answer options")
    ids = {o["id"] for o in data["answer_options"]}
    if data["correct_answer_id"] not in ids:
        raise ValueError("correct_answer_id not in options")
