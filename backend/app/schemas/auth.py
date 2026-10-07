"""Схемы аутентификации."""

from __future__ import annotations

from pydantic import EmailStr, Field, field_validator

from app.schemas.common import ORMModel
from app.schemas.user import UserOut


class RegisterRequest(ORMModel):
    """Тело запроса регистрации."""

    username: str = Field(min_length=2, max_length=50, description="Имя пользователя")
    email: EmailStr = Field(description="Адрес электронной почты")
    password: str = Field(min_length=8, max_length=72, description="Пароль, не менее 8 символов")

    @field_validator("username")
    @classmethod
    def _strip_username(cls, value: str) -> str:
        value = value.strip()
        if not value:
            raise ValueError("Имя пользователя не может быть пустым")
        return value

    @field_validator("password")
    @classmethod
    def _check_password(cls, value: str) -> str:
        if len(value) < 8:
            raise ValueError("Пароль должен содержать не менее 8 символов")
        return value


class LoginRequest(ORMModel):
    """Тело запроса входа."""

    email: EmailStr = Field(description="Адрес электронной почты")
    password: str = Field(min_length=1, description="Пароль")


class TokenResponse(ORMModel):
    """Ответ регистрации и входа: токен доступа и данные пользователя."""

    access_token: str
    token_type: str = "bearer"
    user: UserOut
