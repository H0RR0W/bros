from fastapi import APIRouter, Depends, HTTPException, Request
from fastapi.responses import Response
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.auth.models import User
from app.certificates.models import Certificate
from app.certificates.service import generate_qr_bytes
from app.database import get_db
from app.dependencies import get_current_user

router = APIRouter(prefix="/certificates", tags=["certificates"])


@router.get("/verify/{verification_code}")
async def verify_certificate(
    verification_code: str,
    db: AsyncSession = Depends(get_db),
):
    """Public endpoint — no auth required."""
    result = await db.execute(
        select(Certificate).where(Certificate.verification_code == verification_code)
    )
    cert = result.scalar_one_or_none()
    if not cert:
        raise HTTPException(status_code=404, detail="Сертификат не найден")

    user_result = await db.execute(select(User).where(User.id == cert.user_id))
    user = user_result.scalar_one_or_none()

    return {
        "username": user.username if user else "unknown",
        "location": cert.location,
        "score": cert.final_score,
        "accuracy": cert.accuracy_percent,
        "issued_at": cert.issued_at.isoformat(),
        "is_valid": cert.is_valid,
    }


@router.get("/{cert_id}/qr")
async def get_qr_code(
    cert_id: str,
    request: Request,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    result = await db.execute(
        select(Certificate).where(Certificate.id == cert_id, Certificate.user_id == current_user.id)
    )
    cert = result.scalar_one_or_none()
    if not cert:
        raise HTTPException(status_code=404, detail="Сертификат не найден")

    base_url = str(request.base_url).rstrip("/")
    verify_url = f"{base_url}/api/certificates/verify/{cert.verification_code}"
    qr_bytes = generate_qr_bytes(verify_url)
    return Response(content=qr_bytes, media_type="image/png")
