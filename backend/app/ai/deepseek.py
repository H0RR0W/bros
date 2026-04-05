"""DeepSeek API async client."""
import json

import httpx

from app.config import settings


async def call_deepseek(system_prompt: str, user_prompt: str) -> dict:
    """Call DeepSeek Chat API and return parsed JSON response."""
    if not settings.DEEPSEEK_API_KEY:
        raise RuntimeError("DEEPSEEK_API_KEY not configured")

    async with httpx.AsyncClient(timeout=settings.DEEPSEEK_TIMEOUT) as client:
        resp = await client.post(
            f"{settings.DEEPSEEK_BASE_URL}/chat/completions",
            headers={
                "Authorization": f"Bearer {settings.DEEPSEEK_API_KEY}",
                "Content-Type": "application/json",
            },
            json={
                "model": settings.DEEPSEEK_MODEL,
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
