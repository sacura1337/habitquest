"""Схемы пользователя и профиля."""

from __future__ import annotations

from pydantic import EmailStr, Field, field_validator

from app.schemas.common import DateTimeOut, ORMModel


class UserOut(ORMModel):
    """Публичные данные пользователя (поле ``user`` в ответах авторизации)."""

    id: int
    username: str
    email: EmailStr
    xp: int
    level: int
    avatar_url: str | None
    created_at: DateTimeOut


class UserUpdate(ORMModel):
    """Тело запроса изменения профиля (``PATCH /api/users/me``)."""

    username: str | None = Field(default=None, min_length=2, max_length=50)
    avatar_url: str | None = Field(default=None, max_length=500)

    @field_validator("username")
    @classmethod
    def _strip_username(cls, value: str | None) -> str | None:
        if value is None:
            return None
        value = value.strip()
        if not value:
            raise ValueError("Имя пользователя не может быть пустым")
        return value


class LevelProgress(ORMModel):
    """Прогресс до следующего уровня."""

    current: int
    target: int
    percent: int


class UserStatsOut(ORMModel):
    """Сводная статистика профиля (``GET /api/users/me/stats``)."""

    total_habits: int
    active_habits: int
    total_completions: int
    xp: int
    level: int
    level_progress: LevelProgress
    best_streak: int
    achievements_unlocked: int
