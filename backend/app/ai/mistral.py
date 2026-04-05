"""Mistral AI async client."""
import json

import httpx

from app.config import settings


async def call_mistral(system_prompt: str, user_prompt: str) -> dict:
    """Call Mistral Chat API and return parsed JSON response."""
    if not settings.MISTRAL_API_KEY:
        raise RuntimeError("MISTRAL_API_KEY not configured")

    async with httpx.AsyncClient(timeout=settings.MISTRAL_TIMEOUT) as client:
        resp = await client.post(
            f"{settings.MISTRAL_BASE_URL}/chat/completions",
            headers={
                "Authorization": f"Bearer {settings.MISTRAL_API_KEY}",
                "Content-Type": "application/json",
            },
            json={
                "model": settings.MISTRAL_MODEL,
                "messages": [
                    {"role": "system", "content": system_prompt},
                    {"role": "user", "content": user_prompt},
                ],
                "temperature": 0.7,
                "response_format": {"type": "json_object"},
            },
        )
        resp.raise_for_status()
        data = resp.json()
        content = data["choices"][0]["message"]["content"]
        return json.loads(content)
