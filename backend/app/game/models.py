import uuid
from datetime import datetime

from sqlalchemy import Boolean, DateTime, ForeignKey, Integer, String, Text, func
from sqlalchemy.dialects.postgresql import JSONB, UUID
from sqlalchemy.orm import Mapped, mapped_column

from app.database import Base


class Scenario(Base):
    __tablename__ = "scenarios"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    location: Mapped[str] = mapped_column(String(20), nullable=False, index=True)  # office|home|wifi
    attack_type: Mapped[str] = mapped_column(String(50), nullable=False, index=True)
    cwe_id: Mapped[str] = mapped_column(String(20), nullable=False)
    owasp_category: Mapped[str] = mapped_column(String(10), nullable=False)
    scenario_text: Mapped[str] = mapped_column(Text, nullable=False)
    answer_options: Mapped[list] = mapped_column(JSONB, nullable=False)  # [{id, text, is_correct}]
    correct_answer_id: Mapped[str] = mapped_column(String(2), nullable=False)
    explanation_wrong: Mapped[str] = mapped_column(Text, nullable=False)
    explanation_correct: Mapped[str] = mapped_column(Text, nullable=False)
    is_ai_generated: Mapped[bool] = mapped_column(Boolean, default=False)
    is_published: Mapped[bool] = mapped_column(Boolean, default=True, index=True)
    created_by: Mapped[uuid.UUID | None] = mapped_column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())


class GameSession(Base):
    __tablename__ = "game_sessions"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False, index=True)
    location: Mapped[str] = mapped_column(String(20), nullable=False)
    hp_start: Mapped[int] = mapped_column(Integer, default=100)
    hp_end: Mapped[int | None] = mapped_column(Integer, nullable=True)
    score_earned: Mapped[int] = mapped_column(Integer, default=0)
    scenarios_count: Mapped[int] = mapped_column(Integer, default=0)
    correct_count: Mapped[int] = mapped_column(Integer, default=0)
    completed: Mapped[bool] = mapped_column(Boolean, default=False)
    started_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())
    finished_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)


class UserChoice(Base):
    __tablename__ = "user_choices"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    session_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("game_sessions.id"), nullable=False, index=True
    )
    scenario_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("scenarios.id"), nullable=False
    )
    chosen_answer_id: Mapped[str] = mapped_column(String(2), nullable=False)
    is_correct: Mapped[bool] = mapped_column(Boolean, nullable=False)
    hp_delta: Mapped[int] = mapped_column(Integer, nullable=False)
    score_delta: Mapped[int] = mapped_column(Integer, default=0)
    chosen_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())
