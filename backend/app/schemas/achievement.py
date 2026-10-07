"""Схемы достижений."""

from __future__ import annotations

from pydantic import BaseModel

from app.schemas.common import DateTimeOut, ORMModel


class AchievementProgress(ORMModel):
    """Прогресс получения достижения."""

    current: int
    target: int
    percent: int


class AchievementBrief(ORMModel):
    """Краткая карточка достижения (в ответе отметки выполнения)."""

    id: int
    name: str
    description: str
    icon: str
    xp_reward: int


class AchievementOut(ORMModel):
    """Достижение со статусом получения и прогрессом."""

    id: int
    name: str
    description: str
    icon: str
    xp_reward: int
    unlocked: bool
    unlocked_at: DateTimeOut | None
    progress: AchievementProgress
