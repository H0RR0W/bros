"""FastAPI application entrypoint."""
import logging

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.admin.router import router as admin_router
from app.auth.router import router as auth_router
from app.certificates.router import router as cert_router
from app.config import settings
from app.game.router import router as game_router
from app.leaderboard.router import router as leaderboard_router
from app.users.router import router as users_router
from app.websocket.router import router as ws_router

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = FastAPI(
    title="CyberGuard API",
    description="Образовательный симулятор защиты личных данных — REST API",
    version="1.0.0",
    docs_url="/docs",
    redoc_url="/redoc",
)

# ── CORS ──────────────────────────────────────────────────────────────────────
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.allowed_origins_list,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ── Routers ───────────────────────────────────────────────────────────────────
app.include_router(auth_router, prefix="/api")
app.include_router(game_router, prefix="/api")
app.include_router(users_router, prefix="/api")
app.include_router(leaderboard_router, prefix="/api")
app.include_router(cert_router, prefix="/api")
app.include_router(admin_router, prefix="/api")
app.include_router(ws_router)  # WS route at /ws/game/{session_id}


@app.get("/health")
async def health():
    return {"status": "ok"}


# ── Startup: seed admin + fallback scenarios ──────────────────────────────────
@app.on_event("startup")
async def on_startup():
    await _seed_admin()
    await _seed_fallback_scenarios()


async def _seed_admin():
    from sqlalchemy import select

    from app.auth.models import User
    from app.auth.service import hash_password
    from app.database import AsyncSessionLocal

    async with AsyncSessionLocal() as db:
        result = await db.execute(select(User).where(User.email == settings.FIRST_ADMIN_EMAIL))
        if result.scalar_one_or_none():
            return
        admin = User(
            email=settings.FIRST_ADMIN_EMAIL,
            username="admin",
            password_hash=hash_password(settings.FIRST_ADMIN_PASSWORD),
            role="admin",
        )
        db.add(admin)
        await db.commit()
        logger.info("Admin user created: %s", settings.FIRST_ADMIN_EMAIL)


async def _seed_fallback_scenarios():
    """Insert hardcoded fallback scenarios into DB if table is empty."""
    from sqlalchemy import func, select

    from app.ai.fallback import FALLBACK_SCENARIOS
    from app.game.models import Scenario
    from app.database import AsyncSessionLocal

    async with AsyncSessionLocal() as db:
        count_result = await db.execute(select(func.count()).select_from(Scenario))
        count = count_result.scalar() or 0
        if count > 0:
            return

        for data in FALLBACK_SCENARIOS:
            scenario = Scenario(
                location=data["location"],
                attack_type=data["attack_type"],
                cwe_id=data["cwe_id"],
                owasp_category=data["owasp_category"],
                scenario_text=data["scenario_text"],
                answer_options=data["answer_options"],
                correct_answer_id=data["correct_answer_id"],
                explanation_wrong=data["explanation_wrong"],
                explanation_correct=data["explanation_correct"],
                is_ai_generated=False,
                is_published=True,
            )
            db.add(scenario)
        await db.commit()
        logger.info("Seeded %d fallback scenarios", len(FALLBACK_SCENARIOS))
