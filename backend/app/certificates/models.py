import uuid
from datetime import datetime

from sqlalchemy import Boolean, DateTime, ForeignKey, Integer, String, func
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column

from app.database import Base


class Certificate(Base):
    __tablename__ = "certificates"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False)
    location: Mapped[str] = mapped_column(String(20), nullable=False)
    final_score: Mapped[int] = mapped_column(Integer, nullable=False)
    accuracy_percent: Mapped[int] = mapped_column(Integer, nullable=False)
    verification_code: Mapped[str] = mapped_column(String(64), unique=True, nullable=False, index=True)
    is_valid: Mapped[bool] = mapped_column(Boolean, default=True)
    issued_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())
