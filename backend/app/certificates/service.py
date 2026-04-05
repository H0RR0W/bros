"""Certificate issuance and QR generation."""
import io
import secrets

import qrcode
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.auth.models import User
from app.certificates.models import Certificate
from app.game.models import GameSession


async def issue_certificate(
    db: AsyncSession,
    user: User,
    session: GameSession,
    accuracy_percent: int,
) -> Certificate:
    # Check if cert already issued for this session
    result = await db.execute(
        select(Certificate)
        .where(
            Certificate.user_id == user.id,
            Certificate.location == session.location,
        )
        .order_by(Certificate.issued_at.desc())
        .limit(1)
    )
    existing = result.scalar_one_or_none()
    if existing and existing.final_score >= session.score_earned:
        return existing  # Already have a better or equal cert

    verification_code = secrets.token_urlsafe(32)
    cert = Certificate(
        user_id=user.id,
        location=session.location,
        final_score=session.score_earned,
        accuracy_percent=accuracy_percent,
        verification_code=verification_code,
        is_valid=True,
    )
    db.add(cert)
    await db.commit()
    await db.refresh(cert)
    return cert


def generate_qr_bytes(verification_url: str) -> bytes:
    """Generate QR code PNG bytes for a verification URL."""
    qr = qrcode.QRCode(version=1, box_size=8, border=2)
    qr.add_data(verification_url)
    qr.make(fit=True)
    img = qr.make_image(fill_color="black", back_color="white")
    buf = io.BytesIO()
    img.save(buf, format="PNG")
    return buf.getvalue()
