"""Статистика: сводка за период, график выполнения, история."""

from __future__ import annotations

from datetime import date, timedelta
from typing import Any

from sqlalchemy import func, select
from sqlalchemy.orm import Session, selectinload

from app.core.database import now
from app.models.category import Category
from app.models.habit import Habit
from app.models.habit_completion import HabitCompletion
from app.models.user import User
from app.services.gamification import max_streak, periods_between

#: Длительность периода в днях для сводки.
PERIOD_DAYS: dict[str, int] = {"day": 1, "week": 7, "month": 30}


def _percent(part: int, total: int) -> int:
    """Процент выполнения с защитой от деления на ноль."""
    if total <= 0:
        return 0
    return min(100, max(0, round(part * 100 / total)))


def period_bounds(period: str, today: date | None = None) -> tuple[date, date]:
    """Границы периода: последние ``N`` дней включительно, заканчивая сегодня."""
    today = today or now().date()
    days = PERIOD_DAYS.get(period, 7)
    return today - timedelta(days=days - 1), today


def load_user_habits(db: Session, user: User) -> list[Habit]:
    """Загрузить привычки пользователя вместе с отметками и категориями."""
    return list(
        db.scalars(
            select(Habit)
            .options(selectinload(Habit.completions), selectinload(Habit.category))
            .where(Habit.user_id == user.id)
            .order_by(Habit.id)
        ).all()
    )


def summary(db: Session, user: User, period: str = "week") -> dict[str, Any]:
    """Сводка выполнения за период (``GET /api/statistics/summary``)."""
    date_from, date_to = period_bounds(period)
    habits = load_user_habits(db, user)

    total_completions = 0
    xp_earned = 0
    possible_completions = 0
    active_habits = 0
    best_streak = 0
    per_category: dict[int, dict[str, Any]] = {}

    for habit in habits:
        frequency = habit.frequency or "daily"
        best_streak = max(best_streak, max_streak([c.completion_date for c in habit.completions], frequency))

        if habit.is_active:
            active_habits += 1
            start = max(date_from, habit.created_at.date())
            possible_completions += periods_between(start, date_to, frequency)

        for completion in habit.completions:
            if not (date_from <= completion.completion_date <= date_to):
                continue
            total_completions += 1
            xp_earned += completion.xp_earned
            category = habit.category
            bucket = per_category.setdefault(
                category.id,
                {
                    "category_id": category.id,
                    "name": category.name,
                    "color": category.color,
                    "count": 0,
                },
            )
            bucket["count"] += 1

    by_category = sorted(
        per_category.values(), key=lambda item: (-item["count"], item["name"])
    )

    return {
        "period": period,
        "from_date": date_from,
        "to_date": date_to,
        "total_completions": total_completions,
        "possible_completions": possible_completions,
        "completion_percent": _percent(total_completions, possible_completions),
        "xp_earned": xp_earned,
        "active_habits": active_habits,
        "best_streak": best_streak,
        "by_category": by_category,
    }


def progress(db: Session, user: User, days: int = 30) -> list[dict[str, Any]]:
    """Точки графика выполнения по дням (``GET /api/statistics/progress``)."""
    days = max(1, min(days, 365))
    today = now().date()
    date_from = today - timedelta(days=days - 1)

    habits = load_user_habits(db, user)
    counts: dict[date, int] = {}
    for habit in habits:
        for completion in habit.completions:
            if completion.completion_date >= date_from:
                counts[completion.completion_date] = (
                    counts.get(completion.completion_date, 0) + 1
                )

    points: list[dict[str, Any]] = []
    for offset in range(days):
        current = date_from + timedelta(days=offset)
        completed = counts.get(current, 0)
        total = sum(
            1
            for habit in habits
            if habit.is_active and habit.created_at.date() <= current
        )
        points.append(
            {
                "date": current,
                "completed": completed,
                "total": total,
                "percent": _percent(completed, total),
            }
        )
    return points


def history(db: Session, user: User, limit: int = 20, offset: int = 0) -> dict[str, Any]:
    """История выполнения всех привычек пользователя (``GET /api/statistics/history``)."""
    base = (
        select(HabitCompletion, Habit.name, Category.name)
        .join(Habit, Habit.id == HabitCompletion.habit_id)
        .join(Category, Category.id == Habit.category_id)
        .where(Habit.user_id == user.id)
    )
    total = int(
        db.scalar(
            select(func.count())
            .select_from(HabitCompletion)
            .join(Habit, Habit.id == HabitCompletion.habit_id)
            .where(Habit.user_id == user.id)
        )
        or 0
    )
    rows = db.execute(
        base.order_by(HabitCompletion.completed_at.desc(), HabitCompletion.id.desc())
        .limit(limit)
        .offset(offset)
    ).all()

    items = [
        {
            "id": completion.id,
            "habit_id": completion.habit_id,
            "habit_name": habit_name,
            "category_name": category_name,
            "completed_at": completion.completed_at,
            "xp_earned": completion.xp_earned,
        }
        for completion, habit_name, category_name in rows
    ]
    return {"items": items, "total": total}
