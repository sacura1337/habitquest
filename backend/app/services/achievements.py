"""Достижения: каталог, расчёт прогресса, автоматическая выдача.

Каталог соответствует разделу 9 документа ``docs/API.md``.
Проверка условий выполняется после отметки выполнения, создания привычки
и повышения уровня (см. :func:`sync_achievements`).
"""

from __future__ import annotations

from collections import Counter
from dataclasses import dataclass
from datetime import date
from typing import Any

from sqlalchemy import select
from sqlalchemy.orm import Session, selectinload

from app.core.database import now
from app.models.achievement import Achievement
from app.models.habit import Habit
from app.models.user import User
from app.models.user_achievement import UserAchievement
from app.services.gamification import add_xp, max_streak

#: Стартовый набор достижений (docs/API.md, раздел 9).
ACHIEVEMENTS: list[dict[str, Any]] = [
    {
        "code": "first_habit",
        "name": "Первый шаг",
        "description": "Выполнить привычку впервые",
        "icon": "sparkles",
        "xp_reward": 20,
        "target": 1,
        "condition_type": "total_completions",
    },
    {
        "code": "streak_3",
        "name": "Три дня подряд",
        "description": "Выполнять привычку 3 дня подряд",
        "icon": "flame",
        "xp_reward": 30,
        "target": 3,
        "condition_type": "best_streak",
    },
    {
        "code": "streak_7",
        "name": "Неделя силы",
        "description": "Выполнять привычку 7 дней подряд",
        "icon": "flame",
        "xp_reward": 50,
        "target": 7,
        "condition_type": "best_streak",
    },
    {
        "code": "streak_30",
        "name": "Месяц дисциплины",
        "description": "Выполнять привычку 30 дней подряд",
        "icon": "flame",
        "xp_reward": 200,
        "target": 30,
        "condition_type": "best_streak",
    },
    {
        "code": "completions_5",
        "name": "Разогрев",
        "description": "5 выполнений привычек всего",
        "icon": "zap",
        "xp_reward": 30,
        "target": 5,
        "condition_type": "total_completions",
    },
    {
        "code": "completions_50",
        "name": "Полсотни",
        "description": "50 выполнений привычек всего",
        "icon": "zap",
        "xp_reward": 100,
        "target": 50,
        "condition_type": "total_completions",
    },
    {
        "code": "completions_100",
        "name": "Сотня",
        "description": "100 выполнений привычек всего",
        "icon": "trophy",
        "xp_reward": 200,
        "target": 100,
        "condition_type": "total_completions",
    },
    {
        "code": "habits_5",
        "name": "Коллекционер",
        "description": "Создать 5 привычек",
        "icon": "layers",
        "xp_reward": 40,
        "target": 5,
        "condition_type": "total_habits",
    },
    {
        "code": "level_5",
        "name": "Пятый уровень",
        "description": "Достичь 5 уровня",
        "icon": "star",
        "xp_reward": 100,
        "target": 5,
        "condition_type": "level",
    },
    {
        "code": "day_3",
        "name": "Тройной удар",
        "description": "Выполнить 3 привычки за один день",
        "icon": "target",
        "xp_reward": 40,
        "target": 3,
        "condition_type": "completions_in_day",
    },
    {
        "code": "early_bird",
        "name": "Ранняя птица",
        "description": "Отметить выполнение до 08:00",
        "icon": "sunrise",
        "xp_reward": 30,
        "target": 1,
        "condition_type": "early_completion",
    },
    {
        "code": "all_categories",
        "name": "Полный охват",
        "description": "Иметь привычки во всех категориях",
        "icon": "layout-grid",
        "xp_reward": 60,
        "target": 8,
        "condition_type": "categories_covered",
    },
]

#: Раннее время отметки (до 08:00) для достижения «Ранняя птица».
EARLY_HOUR = 8


@dataclass
class UserMetrics:
    """Метрики пользователя, по которым проверяются условия достижений."""

    total_completions: int = 0
    best_streak: int = 0
    total_habits: int = 0
    level: int = 1
    completions_in_day: int = 0
    early_completion: int = 0
    categories_covered: int = 0


def collect_metrics(db: Session, user: User, today: date | None = None) -> UserMetrics:
    """Собрать метрики пользователя для проверки достижений."""
    today = today or now().date()
    habits = list(
        db.scalars(
            select(Habit)
            .options(selectinload(Habit.completions))
            .where(Habit.user_id == user.id)
        ).all()
    )

    metrics = UserMetrics(
        total_habits=len(habits),
        level=user.level or 1,
        categories_covered=len({habit.category_id for habit in habits}),
    )

    per_day: Counter[date] = Counter()
    for habit in habits:
        dates = [completion.completion_date for completion in habit.completions]
        metrics.total_completions += len(dates)
        metrics.best_streak = max(
            metrics.best_streak, max_streak(dates, habit.frequency or "daily")
        )
        per_day.update(dates)
        if metrics.early_completion == 0 and any(
            completion.completed_at.hour < EARLY_HOUR for completion in habit.completions
        ):
            metrics.early_completion = 1

    metrics.completions_in_day = max(per_day.values()) if per_day else 0
    return metrics


def metric_value(metrics: UserMetrics, condition_type: str) -> int:
    """Текущее значение метрики для типа условия достижения."""
    mapping = {
        "total_completions": metrics.total_completions,
        "best_streak": metrics.best_streak,
        "total_habits": metrics.total_habits,
        "level": metrics.level,
        "completions_in_day": metrics.completions_in_day,
        "early_completion": metrics.early_completion,
        "categories_covered": metrics.categories_covered,
    }
    return int(mapping.get(condition_type, 0))


def build_progress(current: int, target: int) -> dict[str, int]:
    """Прогресс достижения: ``{current, target, percent}`` (current ≤ target)."""
    target = max(1, target)
    capped = min(max(current, 0), target)
    return {
        "current": capped,
        "target": target,
        "percent": min(100, round(capped * 100 / target)),
    }


def sync_achievements(db: Session, user: User) -> list[Achievement]:
    """Выдать все достижения, условия которых выполнены. Вернуть новые.

    Начисление XP за достижение может повысить уровень пользователя и тем
    самым открыть достижение ``level_5``, поэтому проверка повторяется
    несколько раз до стабилизации.
    """
    unlocked: list[Achievement] = []
    for _ in range(5):
        unlocked_ids = set(
            db.scalars(
                select(UserAchievement.achievement_id).where(UserAchievement.user_id == user.id)
            ).all()
        )
        catalog = list(db.scalars(select(Achievement).order_by(Achievement.id)).all())
        locked = [item for item in catalog if item.id not in unlocked_ids]
        if not locked:
            break

        metrics = collect_metrics(db, user)
        newly = [
            item
            for item in locked
            if metric_value(metrics, item.condition_type) >= item.target
        ]
        if not newly:
            break

        unlocked_at = now()
        for item in newly:
            db.add(
                UserAchievement(
                    user_id=user.id, achievement_id=item.id, unlocked_at=unlocked_at
                )
            )
            add_xp(user, item.xp_reward)
            unlocked.append(item)
        db.flush()

    return unlocked


def achievements_with_progress(
    db: Session, user: User, only_unlocked: bool = False
) -> list[dict[str, Any]]:
    """Список достижений с признаком получения и прогрессом."""
    catalog = list(db.scalars(select(Achievement).order_by(Achievement.id)).all())
    links = {
        link.achievement_id: link.unlocked_at
        for link in db.scalars(
            select(UserAchievement).where(UserAchievement.user_id == user.id)
        ).all()
    }
    metrics = collect_metrics(db, user)

    result: list[dict[str, Any]] = []
    for item in catalog:
        is_unlocked = item.id in links
        if only_unlocked and not is_unlocked:
            continue
        result.append(
            {
                "id": item.id,
                "name": item.name,
                "description": item.description,
                "icon": item.icon,
                "xp_reward": item.xp_reward,
                "unlocked": is_unlocked,
                "unlocked_at": links.get(item.id) if is_unlocked else None,
                "progress": build_progress(
                    metric_value(metrics, item.condition_type), item.target
                ),
            }
        )
    return result


def unlocked_count(db: Session, user: User) -> int:
    """Количество полученных пользователем достижений."""
    from sqlalchemy import func

    return int(
        db.scalar(
            select(func.count())
            .select_from(UserAchievement)
            .where(UserAchievement.user_id == user.id)
        )
        or 0
    )


def ensure_catalog(db: Session) -> int:
    """Создать/обновить справочник достижений. Вернуть количество записей."""
    existing = {
        item.code: item for item in db.scalars(select(Achievement)).all()
    }
    for data in ACHIEVEMENTS:
        item = existing.get(data["code"])
        if item is None:
            item = Achievement(**data)
            db.add(item)
            existing[data["code"]] = item
        else:
            # Обновляем целевые значения, чтобы каталог всегда соответствовал коду.
            item.name = data["name"]
            item.description = data["description"]
            item.icon = data["icon"]
            item.xp_reward = data["xp_reward"]
            item.target = data["target"]
            item.condition_type = data["condition_type"]
    db.flush()
    return len(ACHIEVEMENTS)
