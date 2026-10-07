"""Схемы статистики."""

from __future__ import annotations

from datetime import date as dt_date
from typing import Literal

from pydantic import Field

from app.schemas.common import DateOut, DateTimeOut, ORMModel

#: Период сводки.
Period = Literal["day", "week", "month"]


class CategoryStat(ORMModel):
    """Распределение выполнений по категориям."""

    category_id: int
    name: str
    color: str
    count: int


class SummaryOut(ORMModel):
    """Сводка за период (``GET /api/statistics/summary``)."""

    period: Period
    from_date: DateOut = Field(serialization_alias="from")
    to_date: DateOut = Field(serialization_alias="to")
    total_completions: int
    possible_completions: int
    completion_percent: int
    xp_earned: int
    active_habits: int
    best_streak: int
    by_category: list[CategoryStat]


class ProgressPoint(ORMModel):
    """Точка графика выполнения за один день."""

    date: DateOut
    completed: int
    total: int
    percent: int


class HistoryItemOut(ORMModel):
    """Запись истории выполнения."""

    id: int
    habit_id: int
    habit_name: str
    category_name: str
    completed_at: DateTimeOut
    xp_earned: int


class HistoryOut(ORMModel):
    """Постраничная история выполнения всех привычек."""

    items: list[HistoryItemOut]
    total: int
