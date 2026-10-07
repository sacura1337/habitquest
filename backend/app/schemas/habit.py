"""Схемы привычек и отметок выполнения."""

from __future__ import annotations

from datetime import date as dt_date
from datetime import time as dt_time
from typing import Literal

from pydantic import Field, field_validator

from app.schemas.achievement import AchievementBrief
from app.schemas.common import DateTimeOut, ORMModel, TimeOut

#: Допустимые уровни сложности.
Difficulty = Literal["easy", "medium", "hard"]
#: Допустимые варианты частоты выполнения.
Frequency = Literal["daily", "weekly", "monthly"]
#: Поля сортировки списка привычек.
SortField = Literal["name", "created_at", "streak"]
#: Направление сортировки.
SortOrder = Literal["asc", "desc"]


class CategoryBrief(ORMModel):
    """Категория внутри карточки привычки."""

    id: int
    name: str
    slug: str
    color: str
    icon: str


class CompletionOut(ORMModel):
    """Отметка выполнения привычки."""

    id: int
    habit_id: int
    completed_at: DateTimeOut
    xp_earned: int


class HabitOut(ORMModel):
    """Карточка привычки в списке и в ответах создания/изменения."""

    id: int
    name: str
    description: str | None
    category: CategoryBrief
    difficulty: Difficulty
    frequency: Frequency
    reminder_time: TimeOut | None
    is_active: bool
    created_at: DateTimeOut
    current_streak: int
    max_streak: int
    completed_today: bool
    xp_per_completion: int


class HabitDetailOut(HabitOut):
    """Подробная карточка привычки (``GET /api/habits/{id}``)."""

    total_completions: int
    completion_percent: int
    recent_completions: list[CompletionOut]


class HabitListOut(ORMModel):
    """Постраничный список привычек."""

    items: list[HabitOut]
    total: int
    page: int
    limit: int
    pages: int


class HabitCreate(ORMModel):
    """Тело запроса создания привычки."""

    name: str = Field(min_length=1, max_length=100, description="Название привычки")
    description: str | None = Field(default=None, max_length=1000, description="Описание")
    category_id: int = Field(description="Идентификатор категории")
    difficulty: Difficulty = Field(default="medium", description="Сложность: easy/medium/hard")
    frequency: Frequency = Field(default="daily", description="Частота: daily/weekly/monthly")
    reminder_time: dt_time | None = Field(default=None, description="Время напоминания, ЧЧ:ММ")
    is_active: bool = Field(default=True, description="Активна ли привычка")

    @field_validator("name")
    @classmethod
    def _check_name(cls, value: str) -> str:
        value = value.strip()
        if not value:
            raise ValueError("Название привычки не может быть пустым")
        return value

    @field_validator("description")
    @classmethod
    def _strip_description(cls, value: str | None) -> str | None:
        if value is None:
            return None
        value = value.strip()
        return value or None

    @field_validator("category_id")
    @classmethod
    def _check_category_id(cls, value: int) -> int:
        if value <= 0:
            raise ValueError("Идентификатор категории должен быть положительным числом")
        return value


class HabitUpdate(ORMModel):
    """Тело запроса изменения привычки. Все поля необязательны."""

    name: str | None = Field(default=None, min_length=1, max_length=100)
    description: str | None = Field(default=None, max_length=1000)
    category_id: int | None = None
    difficulty: Difficulty | None = None
    frequency: Frequency | None = None
    reminder_time: dt_time | None = None
    is_active: bool | None = None

    @field_validator("name")
    @classmethod
    def _check_name(cls, value: str | None) -> str | None:
        if value is None:
            return None
        value = value.strip()
        if not value:
            raise ValueError("Название привычки не может быть пустым")
        return value

    @field_validator("description")
    @classmethod
    def _strip_description(cls, value: str | None) -> str | None:
        if value is None:
            return None
        value = value.strip()
        return value or None


class CompleteRequest(ORMModel):
    """Тело запроса отметки выполнения."""

    date: dt_date | None = Field(default=None, description="Дата выполнения, по умолчанию сегодня")


class CompleteResponse(ORMModel):
    """Ответ отметки выполнения привычки."""

    completion: CompletionOut
    habit: HabitOut
    xp_earned: int
    bonus_xp: int
    total_xp: int
    level: int
    level_up: bool
    current_streak: int
    unlocked_achievements: list[AchievementBrief]


class CompletionListOut(ORMModel):
    """История выполнения конкретной привычки."""

    items: list[CompletionOut]
    total: int
