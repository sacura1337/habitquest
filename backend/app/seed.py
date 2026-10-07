"""Наполнение базы данных тестовыми данными.

Запуск из папки ``backend``::

    python -m app.seed

Скрипт идемпотентен: повторный запуск не создаёт дубликаты (категории
проверяются по ``slug``, пользователи — по ``email``, достижения — по ``code``,
привычки — по паре «пользователь + название», отметки — по паре «привычка + дата»).
XP и уровни пользователей пересчитываются из фактических отметок.
"""

from __future__ import annotations

import random
from datetime import date, datetime, time, timedelta

from sqlalchemy import select
from sqlalchemy.orm import Session

from app.core.database import SessionLocal, now
from app.core.security import hash_password
from app.models.achievement import Achievement
from app.models.category import Category
from app.models.habit import Habit
from app.models.habit_completion import HabitCompletion
from app.models.user import User
from app.models.user_achievement import UserAchievement
from app.services.achievements import ensure_catalog, sync_achievements
from app.services.gamification import (
    level_from_xp,
    next_period,
    period_key,
    streak_bonus_xp,
    xp_for_difficulty,
)

#: Категории привычек. Цвета взяты из палитры docs/DESIGN-SYSTEM.md.
CATEGORIES: list[dict[str, str]] = [
    {"name": "Здоровье", "slug": "health", "color": "#10B981", "icon": "heart-pulse"},
    {"name": "Спорт", "slug": "sport", "color": "#EF4444", "icon": "dumbbell"},
    {"name": "Образование", "slug": "education", "color": "#4F46E5", "icon": "graduation-cap"},
    {"name": "Работа", "slug": "work", "color": "#64748B", "icon": "briefcase"},
    {"name": "Саморазвитие", "slug": "growth", "color": "#6366F1", "icon": "book"},
    {"name": "Дом", "slug": "home", "color": "#F59E0B", "icon": "home"},
    {"name": "Финансы", "slug": "finance", "color": "#047857", "icon": "wallet"},
    {"name": "Отдых", "slug": "leisure", "color": "#818CF8", "icon": "palmtree"},
]

#: Тестовые пользователи. demo@habitquest.ru / demo1234 — основной аккаунт.
USERS: list[dict[str, object]] = [
    {
        "username": "Михаил",
        "email": "demo@habitquest.ru",
        "password": "demo1234",
        "avatar_url": None,
        "days_ago": 60,
    },
    {
        "username": "Анна",
        "email": "anna@habitquest.ru",
        "password": "anna12345",
        "avatar_url": None,
        "days_ago": 45,
    },
    {
        "username": "Илья",
        "email": "ilya@habitquest.ru",
        "password": "ilya12345",
        "avatar_url": None,
        "days_ago": 35,
    },
]

#: Привычки: ``recent`` — сколько последних периодов отмечено гарантированно
#: (чтобы серии и графики были не пустыми).
HABITS: list[dict[str, object]] = [
    # --- Михаил (demo@habitquest.ru) — привычки во всех восьми категориях ---
    {
        "email": "demo@habitquest.ru",
        "category": "health",
        "name": "Пить 2 литра воды",
        "description": "Пить воду равномерно в течение дня",
        "difficulty": "easy",
        "frequency": "daily",
        "reminder_time": time(9, 0),
        "days_ago": 58,
        "probability": 0.82,
        "recent": 12,
    },
    {
        "email": "demo@habitquest.ru",
        "category": "sport",
        "name": "Утренняя зарядка",
        "description": "15 минут разминки сразу после подъёма",
        "difficulty": "medium",
        "frequency": "daily",
        "reminder_time": time(7, 0),
        "days_ago": 55,
        "probability": 0.7,
        "recent": 8,
    },
    {
        "email": "demo@habitquest.ru",
        "category": "growth",
        "name": "Читать 20 минут",
        "description": "Художественная литература",
        "difficulty": "easy",
        "frequency": "daily",
        "reminder_time": time(21, 0),
        "days_ago": 50,
        "probability": 0.8,
        "recent": 13,
    },
    {
        "email": "demo@habitquest.ru",
        "category": "education",
        "name": "Учить английский язык",
        "description": "Одно занятие по учебнику и 10 новых слов",
        "difficulty": "medium",
        "frequency": "daily",
        "reminder_time": time(19, 30),
        "days_ago": 45,
        "probability": 0.65,
        "recent": 5,
    },
    {
        "email": "demo@habitquest.ru",
        "category": "work",
        "name": "Планировать рабочий день",
        "description": "Составить список задач на день",
        "difficulty": "easy",
        "frequency": "daily",
        "reminder_time": time(8, 30),
        "days_ago": 40,
        "probability": 0.78,
        "recent": 21,
    },
    {
        "email": "demo@habitquest.ru",
        "category": "home",
        "name": "Уборка 15 минут",
        "description": "Быстрая уборка одной комнаты",
        "difficulty": "easy",
        "frequency": "daily",
        "reminder_time": time(18, 0),
        "days_ago": 35,
        "probability": 0.6,
        "recent": 3,
    },
    {
        "email": "demo@habitquest.ru",
        "category": "finance",
        "name": "Записывать расходы",
        "description": "Внести все траты за день в таблицу",
        "difficulty": "medium",
        "frequency": "daily",
        "reminder_time": time(22, 0),
        "days_ago": 30,
        "probability": 0.7,
        "recent": 6,
    },
    {
        "email": "demo@habitquest.ru",
        "category": "leisure",
        "name": "Прогулка без телефона",
        "description": "Час прогулки без уведомлений",
        "difficulty": "easy",
        "frequency": "weekly",
        "reminder_time": time(12, 0),
        "days_ago": 35,
        "probability": 0.8,
        "recent": 2,
    },
    {
        "email": "demo@habitquest.ru",
        "category": "health",
        "name": "Контрастный душ",
        "description": "Завершать утро контрастным душем",
        "difficulty": "hard",
        "frequency": "daily",
        "reminder_time": time(7, 30),
        "days_ago": 20,
        "probability": 0.5,
        "recent": 4,
    },
    # --- Анна (anna@habitquest.ru) ---
    {
        "email": "anna@habitquest.ru",
        "category": "health",
        "name": "Пить воду по утрам",
        "description": "Стакан воды сразу после пробуждения",
        "difficulty": "easy",
        "frequency": "daily",
        "reminder_time": time(10, 0),
        "days_ago": 40,
        "probability": 0.7,
        "recent": 5,
    },
    {
        "email": "anna@habitquest.ru",
        "category": "sport",
        "name": "Йога 15 минут",
        "description": "Комплекс на растяжку и осанку",
        "difficulty": "medium",
        "frequency": "daily",
        "reminder_time": time(8, 0),
        "days_ago": 35,
        "probability": 0.6,
        "recent": 3,
    },
    {
        "email": "anna@habitquest.ru",
        "category": "growth",
        "name": "Читать перед сном",
        "description": "Бумажная книга вместо телефона",
        "difficulty": "easy",
        "frequency": "daily",
        "reminder_time": time(22, 30),
        "days_ago": 30,
        "probability": 0.75,
        "recent": 9,
    },
    {
        "email": "anna@habitquest.ru",
        "category": "work",
        "name": "Разбирать почту",
        "description": "Отвечать на письма и чистить входящие",
        "difficulty": "easy",
        "frequency": "daily",
        "reminder_time": time(9, 30),
        "days_ago": 25,
        "probability": 0.65,
        "recent": 2,
    },
    # --- Илья (ilya@habitquest.ru) ---
    {
        "email": "ilya@habitquest.ru",
        "category": "sport",
        "name": "Бегать по утрам",
        "description": "Лёгкая пробежка 3 км",
        "difficulty": "hard",
        "frequency": "daily",
        "reminder_time": time(6, 30),
        "days_ago": 30,
        "probability": 0.5,
        "recent": 2,
    },
    {
        "email": "ilya@habitquest.ru",
        "category": "education",
        "name": "Учить новое слово",
        "description": "Одно новое слово иностранного языка в день",
        "difficulty": "easy",
        "frequency": "daily",
        "reminder_time": time(12, 0),
        "days_ago": 25,
        "probability": 0.8,
        "recent": 11,
    },
]


# --------------------------------------------------------------------------
# Генерация данных
# --------------------------------------------------------------------------
def _generate_dates(rng: random.Random, config: dict, today: date) -> set[date]:
    """Сгенерировать правдоподобный набор дат выполнения привычки."""
    days_ago = int(config["days_ago"])
    start = today - timedelta(days=days_ago)
    frequency = str(config["frequency"])
    probability = float(config["probability"])
    recent = int(config.get("recent", 0))
    dates: set[date] = set()

    if frequency == "weekly":
        weekday = rng.randint(0, 6)
        week_start = start - timedelta(days=start.weekday())
        while week_start <= today:
            if rng.random() < probability:
                dates.add(week_start + timedelta(days=weekday))
            week_start += timedelta(days=7)
        for index in range(recent):
            moment = today - timedelta(days=7 * index)
            dates.add(moment - timedelta(days=moment.weekday()) + timedelta(days=weekday))
    elif frequency == "monthly":
        day_of_month = rng.randint(1, 28)
        cursor = start.replace(day=1)
        while cursor <= today:
            if rng.random() < probability:
                dates.add(cursor.replace(day=day_of_month))
            cursor = next_period(cursor, "monthly")
    else:
        for offset in range(days_ago + 1):
            if rng.random() < probability:
                dates.add(start + timedelta(days=offset))
        for index in range(recent):
            dates.add(today - timedelta(days=index))

    return {moment for moment in dates if start <= moment <= today}


def _completion_moment(rng: random.Random, moment_date: date, config: dict) -> datetime:
    """Время отметки: около времени напоминания привычки."""
    base = config.get("reminder_time") or time(12, 0)
    hour, minute = base.hour, base.minute + rng.randint(-15, 15)
    if minute < 0:
        minute += 60
        hour = (hour - 1) % 24
    elif minute > 59:
        minute -= 60
        hour = (hour + 1) % 24
    return datetime.combine(moment_date, time(hour, minute, 0))


# --------------------------------------------------------------------------
# Наполнение
# --------------------------------------------------------------------------
def seed_categories(db: Session) -> dict[str, Category]:
    """Создать категории, которых ещё нет."""
    existing = {item.slug: item for item in db.scalars(select(Category)).all()}
    for data in CATEGORIES:
        if data["slug"] not in existing:
            category = Category(**data)
            db.add(category)
            existing[data["slug"]] = category
    db.flush()
    return existing


def seed_users(db: Session, today: date) -> dict[str, User]:
    """Создать тестовых пользователей, которых ещё нет."""
    existing = {item.email: item for item in db.scalars(select(User)).all()}
    for data in USERS:
        email = str(data["email"])
        if email in existing:
            continue
        created = datetime.combine(
            today - timedelta(days=int(data["days_ago"])), time(9, 0)
        )
        user = User(
            username=str(data["username"]),
            email=email,
            password_hash=hash_password(str(data["password"])),
            xp=0,
            level=1,
            avatar_url=data["avatar_url"],
            created_at=created,
        )
        db.add(user)
        existing[email] = user
    db.flush()
    return existing


def seed_habits(
    db: Session, users: dict[str, User], categories: dict[str, Category], today: date
) -> None:
    """Создать привычки и сгенерировать историю их выполнения."""
    for config in HABITS:
        user = users[str(config["email"])]
        category = categories[str(config["category"])]
        name = str(config["name"])

        habit = db.scalar(
            select(Habit).where(Habit.user_id == user.id, Habit.name == name)
        )
        if habit is None:
            habit = Habit(
                user_id=user.id,
                name=name,
                description=str(config["description"]),
                category_id=category.id,
                difficulty=str(config["difficulty"]),
                frequency=str(config["frequency"]),
                reminder_time=config["reminder_time"],
                is_active=True,
                created_at=datetime.combine(
                    today - timedelta(days=int(config["days_ago"])), time(9, 0)
                ),
            )
            db.add(habit)
            db.flush()

        rng = random.Random(f"{config['email']}:{name}")
        existing_dates = {
            item.completion_date
            for item in db.scalars(
                select(HabitCompletion).where(HabitCompletion.habit_id == habit.id)
            ).all()
        }
        for moment_date in sorted(_generate_dates(rng, config, today)):
            if moment_date in existing_dates:
                continue
            db.add(
                HabitCompletion(
                    habit_id=habit.id,
                    completed_at=_completion_moment(rng, moment_date, config),
                    completion_date=moment_date,
                    xp_earned=0,
                )
            )
    db.flush()


def recalculate_xp(db: Session) -> None:
    """Пересчитать XP отметок и итоговые XP/уровни пользователей.

    XP за отметку = базовый XP сложности + бонус за серию (+5 XP за каждые
    7 периодов непрерывной серии). К сумме добавляются награды за уже
    полученные достижения — это делает повторный запуск идемпотентным.
    """
    for user in db.scalars(select(User)).all():
        total = 0
        habits = db.scalars(select(Habit).where(Habit.user_id == user.id)).all()
        for habit in habits:
            completions = sorted(
                db.scalars(
                    select(HabitCompletion)
                    .where(HabitCompletion.habit_id == habit.id)
                    .order_by(HabitCompletion.completion_date, HabitCompletion.id)
                ).all(),
                key=lambda item: (item.completion_date, item.id),
            )
            base_xp = xp_for_difficulty(habit.difficulty)
            run = 0
            previous: date | None = None
            for completion in completions:
                if previous is not None and period_key(
                    completion.completion_date, habit.frequency
                ) == period_key(next_period(previous, habit.frequency), habit.frequency):
                    run += 1
                else:
                    run = 1
                completion.xp_earned = base_xp + streak_bonus_xp(run)
                total += completion.xp_earned
                previous = completion.completion_date

        achievement_bonus = 0
        for link in db.scalars(
            select(UserAchievement).where(UserAchievement.user_id == user.id)
        ).all():
            achievement = db.get(Achievement, link.achievement_id)
            if achievement is not None:
                achievement_bonus += achievement.xp_reward

        user.xp = total + achievement_bonus
        user.level = level_from_xp(user.xp)
    db.flush()


def compute_unlock_times(db: Session, user: User) -> dict[str, datetime]:
    """Определить правдоподобное время получения каждого достижения."""
    habits = db.scalars(select(Habit).where(Habit.user_id == user.id)).all()
    completions: list[tuple[datetime, date, int, str]] = []
    for habit in habits:
        for completion in db.scalars(
            select(HabitCompletion).where(HabitCompletion.habit_id == habit.id)
        ).all():
            completions.append(
                (completion.completed_at, completion.completion_date, habit.id, habit.frequency)
            )
    completions.sort(key=lambda item: (item[0], item[2]))

    moments: dict[str, datetime] = {}
    runs: dict[int, tuple[int, date]] = {}
    per_day: dict[date, int] = {}
    cumulative_xp = 0
    total_completions = 0

    for completed_at, completion_date, habit_id, frequency in completions:
        total_completions += 1
        if total_completions == 1:
            moments.setdefault("first_habit", completed_at)
        if total_completions == 5:
            moments.setdefault("completions_5", completed_at)
        if total_completions == 50:
            moments.setdefault("completions_50", completed_at)
        if total_completions == 100:
            moments.setdefault("completions_100", completed_at)

        previous_date, previous_run = runs.get(habit_id, (completion_date - timedelta(days=1), 0))
        if period_key(completion_date, frequency) == period_key(
            next_period(previous_date, frequency), frequency
        ):
            current_run = previous_run + 1
        else:
            current_run = 1
        runs[habit_id] = (completion_date, current_run)
        if current_run == 3:
            moments.setdefault("streak_3", completed_at)
        if current_run == 7:
            moments.setdefault("streak_7", completed_at)
        if current_run == 30:
            moments.setdefault("streak_30", completed_at)

        per_day[completion_date] = per_day.get(completion_date, 0) + 1
        if per_day[completion_date] == 3:
            moments.setdefault("day_3", completed_at)

        if completed_at.hour < 8:
            moments.setdefault("early_bird", completed_at)

        cumulative_xp += xp_for_difficulty(
            next((habit.difficulty for habit in habits if habit.id == habit_id), "medium")
        ) + streak_bonus_xp(current_run)
        if cumulative_xp >= 1000:
            moments.setdefault("level_5", completed_at)

    created = sorted(habit.created_at for habit in habits)
    if len(created) >= 5:
        moments.setdefault("habits_5", created[4])

    covered: set[int] = set()
    for habit in sorted(habits, key=lambda item: item.created_at):
        covered.add(habit.category_id)
        if len(covered) >= len(CATEGORIES):
            moments.setdefault("all_categories", habit.created_at)
            break

    return moments


def seed_achievements(db: Session, today: date) -> None:
    """Выдать достижения по фактическим данным и проставить время получения."""
    for user in db.scalars(select(User)).all():
        sync_achievements(db, user)
        db.flush()

        moments = compute_unlock_times(db, user)
        for link in db.scalars(
            select(UserAchievement).where(UserAchievement.user_id == user.id)
        ).all():
            achievement = db.get(Achievement, link.achievement_id)
            if achievement is None:
                continue
            moment = moments.get(achievement.code)
            if moment is not None:
                link.unlocked_at = moment
    db.flush()


def seed() -> dict[str, int]:
    """Выполнить наполнение базы данных. Вернуть сводку по количеству записей."""
    today = now().date()
    with SessionLocal() as db:
        ensure_catalog(db)
        categories = seed_categories(db)
        users = seed_users(db, today)
        seed_habits(db, users, categories, today)
        recalculate_xp(db)
        seed_achievements(db, today)
        db.commit()

        summary = {
            "categories": len(db.scalars(select(Category)).all()),
            "achievements": len(db.scalars(select(Achievement)).all()),
            "users": len(db.scalars(select(User)).all()),
            "habits": len(db.scalars(select(Habit)).all()),
            "completions": len(db.scalars(select(HabitCompletion)).all()),
            "user_achievements": len(db.scalars(select(UserAchievement)).all()),
        }
    return summary


def main() -> None:
    """Точка входа скрипта ``python -m app.seed``."""
    summary = seed()
    print("База данных наполнена тестовыми данными:")
    print(f"  категорий:            {summary['categories']}")
    print(f"  достижений:           {summary['achievements']}")
    print(f"  пользователей:        {summary['users']}")
    print(f"  привычек:             {summary['habits']}")
    print(f"  отметок выполнения:   {summary['completions']}")
    print(f"  получено достижений:  {summary['user_achievements']}")
    print()
    print("Тестовый аккаунт: demo@habitquest.ru / demo1234 (Михаил)")


if __name__ == "__main__":
    main()
