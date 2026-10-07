"""Геймификация: опыт (XP), уровни, серии и бонусы.

Правила (docs/API.md, раздел 8):

* XP за привычку: простая — 10, средняя — 20, сложная — 30;
* бонус за серию: +5 XP за каждые 7 дней непрерывной серии;
* порог уровня ``L`` — ``100 × (L − 1) × L / 2`` XP (1 → 0, 2 → 100, 3 → 300, …);
* серия — число последовательных периодов (дней/недель/месяцев), в которых
  привычка выполнена; максимальная серия — наибольшая за всё время.
"""

from __future__ import annotations

import math
from datetime import date, timedelta
from typing import Iterable, Literal

#: XP за одно выполнение в зависимости от сложности привычки.
DIFFICULTY_XP: dict[str, int] = {"easy": 10, "medium": 20, "hard": 30}

#: Сколько XP добавляется за каждые 7 периодов непрерывной серии.
STREAK_BONUS_STEP = 5
STREAK_BONUS_PERIOD = 7

#: Предохранитель от бесконечных циклов при аномальных данных.
_MAX_PERIODS = 100_000

Frequency = Literal["daily", "weekly", "monthly"]


# --------------------------------------------------------------------------
# Опыт и уровни
# --------------------------------------------------------------------------
def xp_for_difficulty(difficulty: str) -> int:
    """Базовый XP за выполнение привычки указанной сложности."""
    return DIFFICULTY_XP.get(difficulty, DIFFICULTY_XP["medium"])


def streak_bonus_xp(streak: int) -> int:
    """Бонус за серию: +5 XP за каждые 7 периодов непрерывной серии."""
    if streak <= 0:
        return 0
    return STREAK_BONUS_STEP * (streak // STREAK_BONUS_PERIOD)


def level_threshold(level: int) -> int:
    """Количество XP, с которого начинается уровень ``level``."""
    if level <= 1:
        return 0
    return 100 * (level - 1) * level // 2


def level_from_xp(xp: int) -> int:
    """Определить уровень по накопленному XP (обратная задача к ``level_threshold``)."""
    xp = max(0, int(xp))
    if xp <= 0:
        return 1
    # Приблизительная оценка через решение 50·L² − 50·L − xp = 0, затем уточнение.
    estimate = int((1 + math.isqrt(1 + 8 * (xp // 100))) // 2)
    level = max(1, estimate)
    guard = 0
    while level_threshold(level + 1) <= xp and guard < _MAX_PERIODS:
        level += 1
        guard += 1
    while level > 1 and level_threshold(level) > xp:
        level -= 1
    return level


def level_progress(xp: int) -> dict[str, int]:
    """Прогресс до следующего уровня: ``{current, target, percent}``."""
    level = level_from_xp(xp)
    current = max(0, xp - level_threshold(level))
    target = level_threshold(level + 1) - level_threshold(level)
    percent = round(current * 100 / target) if target > 0 else 0
    return {"current": current, "target": target, "percent": min(100, max(0, percent))}


def add_xp(user, amount: int) -> bool:  # noqa: ANN001 - ORM-объект User
    """Начислить (или списать) XP пользователю и пересчитать уровень.

    Возвращает ``True``, если пользователь повысил уровень.
    """
    if amount == 0:
        return False
    previous_level = user.level or 1
    user.xp = max(0, (user.xp or 0) + int(amount))
    user.level = level_from_xp(user.xp)
    return user.level > previous_level


# --------------------------------------------------------------------------
# Периоды и серии
# --------------------------------------------------------------------------
def period_key(value: date, frequency: str) -> tuple:
    """Ключ периода для даты: день, ISO-неделя или месяц."""
    if frequency == "weekly":
        iso = value.isocalendar()
        return ("w", iso[0], iso[1])
    if frequency == "monthly":
        return ("m", value.year, value.month)
    return ("d", value.toordinal())


def previous_period(value: date, frequency: str) -> date:
    """Дата, принадлежащая предыдущему периоду."""
    if frequency == "weekly":
        return value - timedelta(days=7)
    if frequency == "monthly":
        return value.replace(day=1) - timedelta(days=1)
    return value - timedelta(days=1)


def next_period(value: date, frequency: str) -> date:
    """Дата, принадлежащая следующему периоду."""
    if frequency == "weekly":
        return value + timedelta(days=7)
    if frequency == "monthly":
        return (value.replace(day=28) + timedelta(days=4)).replace(day=1)
    return value + timedelta(days=1)


def current_streak(dates: Iterable[date], today: date, frequency: str = "daily") -> int:
    """Текущая серия выполнения.

    Серия продолжается, если выполнение есть в текущем периоде; если текущий
    период ещё не закрыт и отметки нет, серия не считается прерванной —
    отсчёт начинается с предыдущего периода.
    """
    keys = {period_key(d, frequency) for d in dates}
    if not keys:
        return 0

    start = today
    if period_key(today, frequency) not in keys:
        candidate = previous_period(today, frequency)
        if period_key(candidate, frequency) in keys:
            start = candidate
        else:
            return 0

    streak = 0
    cursor = start
    while period_key(cursor, frequency) in keys and streak < _MAX_PERIODS:
        streak += 1
        cursor = previous_period(cursor, frequency)
    return streak


def max_streak(dates: Iterable[date], frequency: str = "daily") -> int:
    """Наибольшая серия за всё время."""
    ordered = sorted(set(dates))
    if not ordered:
        return 0
    best = 1
    run = 1
    for previous, current in zip(ordered, ordered[1:]):
        if period_key(current, frequency) == period_key(next_period(previous, frequency), frequency):
            run += 1
        else:
            run = 1
        best = max(best, run)
    return best


def habit_streaks(habit, today: date) -> tuple[int, int]:  # noqa: ANN001 - ORM-объект Habit
    """Пары ``(текущая серия, максимальная серия)`` для привычки."""
    dates = [c.completion_date for c in habit.completions]
    frequency = habit.frequency or "daily"
    return (
        current_streak(dates, today, frequency),
        max_streak(dates, frequency),
    )


def periods_between(start: date, end: date, frequency: str) -> int:
    """Количество периодов частоты ``frequency`` на отрезке ``[start, end]``."""
    if end < start:
        return 0
    if frequency == "daily":
        return (end - start).days + 1
    if frequency == "weekly":
        return ((end - start).days // 7) + 1
    if frequency == "monthly":
        return (end.year - start.year) * 12 + (end.month - start.month) + 1
    return (end - start).days + 1
