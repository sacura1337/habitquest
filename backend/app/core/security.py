"""Безопасность: хеширование паролей (bcrypt) и работа с JWT (PyJWT).

Пароли хранятся только в виде хеша bcrypt — открытый пароль нигде не
сохраняется и не логируется. Библиотека ``passlib`` намеренно не
используется: она несовместима с bcrypt 4.x.
"""

from __future__ import annotations

from datetime import datetime, timedelta, timezone

import bcrypt
import jwt

from app.core.config import settings

#: Ограничение алгоритма bcrypt — не более 72 байт пароля.
MAX_PASSWORD_BYTES = 72


def hash_password(password: str) -> str:
    """Вернуть bcrypt-хеш пароля."""
    raw = password.encode("utf-8")
    if len(raw) > MAX_PASSWORD_BYTES:
        raw = raw[:MAX_PASSWORD_BYTES]
    return bcrypt.hashpw(raw, bcrypt.gensalt()).decode("utf-8")


def verify_password(password: str, password_hash: str) -> bool:
    """Проверить пароль по сохранённому хешу. Ошибки формата — «не подходит»."""
    try:
        raw = password.encode("utf-8")
        if len(raw) > MAX_PASSWORD_BYTES:
            raw = raw[:MAX_PASSWORD_BYTES]
        return bcrypt.checkpw(raw, password_hash.encode("utf-8"))
    except (ValueError, TypeError):
        return False


def create_access_token(subject: int | str, expires_minutes: int | None = None) -> str:
    """Создать подписанный JWT для пользователя (``sub`` = идентификатор)."""
    minutes = expires_minutes if expires_minutes is not None else settings.ACCESS_TOKEN_EXPIRE_MINUTES
    issued_at = datetime.now(timezone.utc)
    payload = {
        "sub": str(subject),
        "type": "access",
        "iat": issued_at,
        "exp": issued_at + timedelta(minutes=minutes),
    }
    return jwt.encode(payload, settings.SECRET_KEY, algorithm=settings.ALGORITHM)


def decode_access_token(token: str) -> dict | None:
    """Расшифровать и проверить JWT. ``None`` — токен недействителен или истёк."""
    try:
        return jwt.decode(token, settings.SECRET_KEY, algorithms=[settings.ALGORITHM])
    except jwt.PyJWTError:
        return None
