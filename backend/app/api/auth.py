"""Аутентификация: регистрация, вход, текущий пользователь.

Здесь же определена зависимость :func:`get_current_user`, которую используют
остальные роутеры для защиты эндпоинтов.
"""

from __future__ import annotations

from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from sqlalchemy import func, select
from sqlalchemy.orm import Session

from app.core.database import get_db, now
from app.core.security import create_access_token, decode_access_token, hash_password, verify_password
from app.models.user import User
from app.schemas.auth import LoginRequest, RegisterRequest, TokenResponse
from app.schemas.user import UserOut

router = APIRouter(prefix="/auth", tags=["Аутентификация"])

bearer_scheme = HTTPBearer(
    auto_error=False,
    description="JWT, полученный в /api/auth/login или /api/auth/register",
)

_UNAUTHORIZED_HEADERS = {"WWW-Authenticate": "Bearer"}


def get_current_user(
    credentials: HTTPAuthorizationCredentials | None = Depends(bearer_scheme),
    db: Session = Depends(get_db),
) -> User:
    """Зависимость: вернуть текущего пользователя по JWT или ответить ``401``."""
    if credentials is None or not credentials.credentials:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Не авторизован: отсутствует токен доступа",
            headers=_UNAUTHORIZED_HEADERS,
        )

    payload = decode_access_token(credentials.credentials)
    if not payload:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Недействительный или истёкший токен",
            headers=_UNAUTHORIZED_HEADERS,
        )

    try:
        user_id = int(payload.get("sub", ""))
    except (TypeError, ValueError):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Недействительный токен: некорректный идентификатор пользователя",
            headers=_UNAUTHORIZED_HEADERS,
        ) from None

    user = db.get(User, user_id)
    if user is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Пользователь не найден",
            headers=_UNAUTHORIZED_HEADERS,
        )
    return user


def _find_by_email(db: Session, email: str) -> User | None:
    """Найти пользователя по e-mail без учёта регистра."""
    return db.scalar(select(User).where(func.lower(User.email) == email.strip().lower()))


@router.post(
    "/register",
    response_model=TokenResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Регистрация пользователя",
)
def register(data: RegisterRequest, db: Session = Depends(get_db)) -> TokenResponse:
    """Создать аккаунт и сразу выдать токен доступа."""
    email = data.email.strip().lower()
    if _find_by_email(db, email) is not None:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="E-mail уже зарегистрирован",
        )

    user = User(
        username=data.username,
        email=email,
        password_hash=hash_password(data.password),
        xp=0,
        level=1,
        created_at=now(),
    )
    db.add(user)
    db.commit()
    db.refresh(user)

    return TokenResponse(
        access_token=create_access_token(user.id),
        token_type="bearer",
        user=UserOut.model_validate(user),
    )


@router.post("/login", response_model=TokenResponse, summary="Вход в аккаунт")
def login(data: LoginRequest, db: Session = Depends(get_db)) -> TokenResponse:
    """Проверить пару «e-mail + пароль» и выдать токен доступа."""
    user = _find_by_email(db, data.email)
    if user is None or not verify_password(data.password, user.password_hash):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Неверный e-mail или пароль",
            headers=_UNAUTHORIZED_HEADERS,
        )

    return TokenResponse(
        access_token=create_access_token(user.id),
        token_type="bearer",
        user=UserOut.model_validate(user),
    )


@router.get("/me", response_model=UserOut, summary="Текущий пользователь")
def read_me(current_user: User = Depends(get_current_user)) -> UserOut:
    """Вернуть данные пользователя, которому принадлежит токен."""
    return UserOut.model_validate(current_user)
