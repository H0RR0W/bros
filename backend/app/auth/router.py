from fastapi import APIRouter, Depends, HTTPException, status
from jose import JWTError
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.auth.models import User
from app.auth.schemas import (
    ChangePasswordRequest,
    LoginRequest,
    RegisterRequest,
    TokenRefreshResponse,
    TokenResponse,
    UpdateProfileRequest,
    UserResponse,
)
from app.auth.service import (
    compute_league,
    create_access_token,
    create_refresh_token,
    decode_token,
    get_user_by_email,
    hash_password,
    verify_password,
)
from app.database import get_db
from app.dependencies import get_current_user

router = APIRouter(prefix="/auth", tags=["auth"])


@router.post("/register", response_model=TokenResponse, status_code=status.HTTP_201_CREATED)
async def register(body: RegisterRequest, db: AsyncSession = Depends(get_db)):
    existing = await get_user_by_email(db, body.email)
    if existing:
        raise HTTPException(status_code=400, detail="Email уже зарегистрирован")

    result = await db.execute(select(User).where(User.username == body.username))
    if result.scalar_one_or_none():
        raise HTTPException(status_code=400, detail="Username уже занят")

    user = User(
        email=body.email,
        username=body.username,
        password_hash=hash_password(body.password),
    )
    db.add(user)
    await db.commit()
    await db.refresh(user)

    return TokenResponse(
        access_token=create_access_token(str(user.id), user.role),
        refresh_token=create_refresh_token(str(user.id)),
        role=user.role,
    )


@router.post("/login", response_model=TokenResponse)
async def login(body: LoginRequest, db: AsyncSession = Depends(get_db)):
    user = await get_user_by_email(db, body.email)
    if not user or not verify_password(body.password, user.password_hash):
        raise HTTPException(status_code=401, detail="Неверный email или пароль")
    if not user.is_active:
        raise HTTPException(status_code=403, detail="Аккаунт заблокирован")

    return TokenResponse(
        access_token=create_access_token(str(user.id), user.role),
        refresh_token=create_refresh_token(str(user.id)),
        role=user.role,
    )


@router.post("/refresh", response_model=TokenRefreshResponse)
async def refresh(refresh_token: str, db: AsyncSession = Depends(get_db)):
    try:
        payload = decode_token(refresh_token)
        if payload.get("type") != "refresh":
            raise HTTPException(status_code=401, detail="Неверный тип токена")
        user_id = payload.get("sub")
    except JWTError:
        raise HTTPException(status_code=401, detail="Недействительный токен")

    result = await db.execute(select(User).where(User.id == user_id))
    user = result.scalar_one_or_none()
    if not user or not user.is_active:
        raise HTTPException(status_code=401, detail="Пользователь не найден")

    return TokenRefreshResponse(access_token=create_access_token(str(user.id), user.role))


@router.post("/logout", status_code=status.HTTP_204_NO_CONTENT)
async def logout(current_user: User = Depends(get_current_user)):
    # Stateless JWT — client drops token; in production, add to Redis blocklist
    return None


@router.get("/me", response_model=UserResponse)
async def me(current_user: User = Depends(get_current_user)):
    return UserResponse(
        id=str(current_user.id),
        email=current_user.email,
        username=current_user.username,
        role=current_user.role,
        hp=current_user.hp,
        total_score=current_user.total_score,
        league=current_user.league,
        is_active=current_user.is_active,
        first_name=current_user.first_name,
        last_name=current_user.last_name,
        patronymic=current_user.patronymic,
    )


@router.patch("/me/profile", response_model=UserResponse)
async def update_profile(
    body: UpdateProfileRequest,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    if body.first_name is not None:
        current_user.first_name = body.first_name or None
    if body.last_name is not None:
        current_user.last_name = body.last_name or None
    if body.patronymic is not None:
        current_user.patronymic = body.patronymic or None
    db.add(current_user)
    await db.commit()
    await db.refresh(current_user)
    return UserResponse(
        id=str(current_user.id),
        email=current_user.email,
        username=current_user.username,
        role=current_user.role,
        hp=current_user.hp,
        total_score=current_user.total_score,
        league=current_user.league,
        is_active=current_user.is_active,
        first_name=current_user.first_name,
        last_name=current_user.last_name,
        patronymic=current_user.patronymic,
    )


@router.post("/me/change-password", status_code=status.HTTP_204_NO_CONTENT)
async def change_password(
    body: ChangePasswordRequest,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    if not verify_password(body.old_password, current_user.password_hash):
        raise HTTPException(status_code=400, detail="Неверный текущий пароль")
    current_user.password_hash = hash_password(body.new_password)
    db.add(current_user)
    await db.commit()
    return None
