"""Привычки: CRUD, отметки выполнения, история привычки."""

from __future__ import annotations

import math
from datetime import date as dt_date
from datetime import datetime

from fastapi import APIRouter, Depends, HTTPException, Query, Response, status
from sqlalchemy import func, select
from sqlalchemy.orm import Session, selectinload

from app.api.auth import get_current_user
from app.core.database import get_db, now
from app.models.category import Category
from app.models.habit import Habit
from app.models.habit_completion import HabitCompletion
from app.models.user import User
from app.schemas.habit import (
    CompleteRequest,
    CompleteResponse,
    CompletionListOut,
    HabitCreate,
    HabitDetailOut,
    HabitListOut,
    HabitOut,
    HabitUpdate,
    SortField,
    SortOrder,
)
from app.services.achievements import sync_achievements
from app.services.gamification import (
    add_xp,
    habit_streaks,
    periods_between,
    streak_bonus_xp,
    xp_for_difficulty,
)

router = APIRouter(prefix="/habits", tags=["Привычки"])

#: Сколько последних отметок возвращается в подробной карточке привычки.
RECENT_COMPLETIONS_LIMIT = 10


def _validation_error(field: str, message: str) -> HTTPException:
    """Ошибка валидации (``422``) в стандартном для FastAPI формате списка полей."""
    return HTTPException(
        status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
        detail=[
            {
                "type": "value_error",
                "loc": ["body", field],
                "msg": message,
                "input": None,
            }
        ],
    )


def _load_habits(db: Session, user: User) -> list[Habit]:
    """Все привычки пользователя с отметками и категориями."""
    return list(
        db.scalars(
            select(Habit)
            .options(selectinload(Habit.completions), selectinload(Habit.category))
            .where(Habit.user_id == user.id)
            .order_by(Habit.id)
        ).all()
    )


def habit_to_out(habit: Habit, today: dt_date) -> dict:
    """Карточка привычки в формате ``HabitOut``."""
    current, maximum = habit_streaks(habit, today)
    return {
        "id": habit.id,
        "name": habit.name,
        "description": habit.description,
        "category": {
            "id": habit.category.id,
            "name": habit.category.name,
            "slug": habit.category.slug,
            "color": habit.category.color,
            "icon": habit.category.icon,
        },
        "difficulty": habit.difficulty,
        "frequency": habit.frequency,
        "reminder_time": habit.reminder_time,
        "is_active": habit.is_active,
        "created_at": habit.created_at,
        "current_streak": current,
        "max_streak": maximum,
        "completed_today": any(item.completion_date == today for item in habit.completions),
        "xp_per_completion": xp_for_difficulty(habit.difficulty),
    }


def _get_owned_habit(db: Session, habit_id: int, user: User) -> Habit:
    """Получить привычку пользователя: ``404`` — нет, ``403`` — чужая."""
    habit = db.get(Habit, habit_id)
    if habit is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Привычка не найдена"
        )
    if habit.user_id != user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Нет доступа к привычке другого пользователя",
        )
    return habit


def _check_category(db: Session, category_id: int) -> Category:
    """Проверить существование категории (иначе ``422``)."""
    category = db.get(Category, category_id)
    if category is None:
        raise _validation_error("category_id", "Категория с указанным идентификатором не найдена")
    return category


def _check_unique_name(
    db: Session, user: User, name: str, exclude_id: int | None = None
) -> None:
    """Проверить уникальность названия привычки у пользователя (иначе ``400``).

    Сравнение выполняется в Python через ``casefold``: SQLite-функция
    ``lower()`` не работает с кириллицей, поэтому в SQL названия сравниваются
    только по точному совпадению.
    """
    needle = name.strip().casefold()
    for habit_id, habit_name in db.execute(
        select(Habit.id, Habit.name).where(Habit.user_id == user.id)
    ).all():
        if exclude_id is not None and habit_id == exclude_id:
            continue
        if (habit_name or "").strip().casefold() == needle:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Привычка с таким названием уже есть",
            )


@router.get("", response_model=HabitListOut, summary="Список привычек")
def list_habits(
    search: str | None = Query(None, description="Поиск по названию и описанию"),
    category_id: int | None = Query(None, description="Фильтр по категории"),
    difficulty: str | None = Query(None, description="Фильтр по сложности: easy/medium/hard"),
    is_active: bool | None = Query(None, description="Фильтр по активности"),
    sort: SortField = Query("created_at", description="Поле сортировки"),
    order: SortOrder = Query("desc", description="Направление сортировки"),
    page: int = Query(1, ge=1, description="Номер страницы, с 1"),
    limit: int = Query(9, ge=1, le=50, description="Размер страницы, 1–50"),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> HabitListOut:
    """Список привычек с поиском, фильтрами, сортировкой и пагинацией."""
    if difficulty is not None and difficulty not in {"easy", "medium", "hard"}:
        raise _validation_error("difficulty", "Допустимые значения: easy, medium, hard")

    habits = _load_habits(db, current_user)

    if search:
        needle = search.strip().lower()
        if needle:
            habits = [
                habit
                for habit in habits
                if needle in (habit.name or "").lower()
                or needle in (habit.description or "").lower()
            ]
    if category_id is not None:
        habits = [habit for habit in habits if habit.category_id == category_id]
    if difficulty is not None:
        habits = [habit for habit in habits if habit.difficulty == difficulty]
    if is_active is not None:
        habits = [habit for habit in habits if bool(habit.is_active) == is_active]

    today = now().date()
    streaks = {habit.id: habit_streaks(habit, today)[0] for habit in habits}
    reverse = order == "desc"

    if sort == "name":
        habits.sort(key=lambda habit: (habit.name or "").casefold(), reverse=reverse)
    elif sort == "streak":
        habits.sort(key=lambda habit: streaks[habit.id], reverse=reverse)
    else:
        habits.sort(key=lambda habit: (habit.created_at, habit.id), reverse=reverse)

    total = len(habits)
    pages = math.ceil(total / limit) if total else 0
    start = (page - 1) * limit
    items = habits[start : start + limit]

    return HabitListOut(
        items=[HabitOut.model_validate(habit_to_out(habit, today)) for habit in items],
        total=total,
        page=page,
        limit=limit,
        pages=pages,
    )


@router.post(
    "",
    response_model=HabitOut,
    status_code=status.HTTP_201_CREATED,
    summary="Создать привычку",
)
def create_habit(
    data: HabitCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> HabitOut:
    """Создать новую привычку пользователя."""
    _check_category(db, data.category_id)
    _check_unique_name(db, current_user, data.name)

    habit = Habit(
        user_id=current_user.id,
        name=data.name,
        description=data.description,
        category_id=data.category_id,
        difficulty=data.difficulty,
        frequency=data.frequency,
        reminder_time=data.reminder_time,
        is_active=data.is_active,
        created_at=now(),
    )
    db.add(habit)
    db.flush()

    # После создания привычки проверяем достижения (например, «Коллекционер»).
    sync_achievements(db, current_user)
    db.commit()
    db.refresh(habit)

    return HabitOut.model_validate(habit_to_out(habit, now().date()))


@router.get("/{habit_id}", response_model=HabitDetailOut, summary="Одна привычка")
def get_habit(
    habit_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> HabitDetailOut:
    """Подробная карточка привычки со статистикой выполнения."""
    habit = _get_owned_habit(db, habit_id, current_user)
    today = now().date()

    completions = sorted(
        habit.completions, key=lambda item: (item.completed_at, item.id), reverse=True
    )
    expected = periods_between(
        min(habit.created_at.date(), today), today, habit.frequency or "daily"
    )
    total_completions = len(completions)
    percent = min(100, round(total_completions * 100 / expected)) if expected > 0 else 0

    payload = habit_to_out(habit, today)
    payload.update(
        {
            "total_completions": total_completions,
            "completion_percent": percent,
            "recent_completions": [
                {
                    "id": item.id,
                    "habit_id": item.habit_id,
                    "completed_at": item.completed_at,
                    "xp_earned": item.xp_earned,
                }
                for item in completions[:RECENT_COMPLETIONS_LIMIT]
            ],
        }
    )
    return HabitDetailOut.model_validate(payload)


@router.patch("/{habit_id}", response_model=HabitOut, summary="Изменить привычку")
def update_habit(
    habit_id: int,
    data: HabitUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> HabitOut:
    """Изменить параметры привычки."""
    habit = _get_owned_habit(db, habit_id, current_user)
    payload = data.model_dump(exclude_unset=True)

    if "category_id" in payload and payload["category_id"] is not None:
        _check_category(db, payload["category_id"])
    if "name" in payload and payload["name"] is not None:
        _check_unique_name(db, current_user, payload["name"], exclude_id=habit.id)

    for field, value in payload.items():
        setattr(habit, field, value)

    db.commit()
    db.refresh(habit)
    return HabitOut.model_validate(habit_to_out(habit, now().date()))


@router.delete(
    "/{habit_id}", status_code=status.HTTP_204_NO_CONTENT, summary="Удалить привычку"
)
def delete_habit(
    habit_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> Response:
    """Удалить привычку вместе с историей её выполнения."""
    habit = _get_owned_habit(db, habit_id, current_user)
    db.delete(habit)
    db.commit()
    return Response(status_code=status.HTTP_204_NO_CONTENT)


@router.post("/{habit_id}/complete", response_model=CompleteResponse, summary="Отметить выполнение")
def complete_habit(
    habit_id: int,
    data: CompleteRequest | None = None,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> CompleteResponse:
    """Отметить привычку выполненной, начислить XP и проверить достижения."""
    habit = _get_owned_habit(db, habit_id, current_user)
    today = now().date()
    target_date = data.date if data and data.date else today

    if target_date > today:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Нельзя отметить выполнение на будущую дату",
        )

    existing = db.scalar(
        select(HabitCompletion).where(
            HabitCompletion.habit_id == habit.id,
            HabitCompletion.completion_date == target_date,
        )
    )
    if existing is not None:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Привычка уже отмечена за эту дату",
        )

    moment = now() if target_date == today else datetime.combine(target_date, now().time())
    completion = HabitCompletion(
        habit_id=habit.id,
        completed_at=moment,
        completion_date=target_date,
        xp_earned=0,
    )
    db.add(completion)
    habit.completions.append(completion)
    db.flush()

    streak, _ = habit_streaks(habit, today)
    base_xp = xp_for_difficulty(habit.difficulty)
    bonus_xp = streak_bonus_xp(streak)
    xp_earned = base_xp + bonus_xp
    completion.xp_earned = xp_earned

    level_before = current_user.level
    add_xp(current_user, xp_earned)
    unlocked = sync_achievements(db, current_user)
    level_up = current_user.level > level_before

    db.commit()
    db.refresh(completion)
    db.refresh(habit)

    return CompleteResponse.model_validate(
        {
            "completion": {
                "id": completion.id,
                "habit_id": completion.habit_id,
                "completed_at": completion.completed_at,
                "xp_earned": completion.xp_earned,
            },
            "habit": habit_to_out(habit, today),
            "xp_earned": xp_earned,
            "bonus_xp": bonus_xp,
            "total_xp": current_user.xp,
            "level": current_user.level,
            "level_up": level_up,
            "current_streak": streak,
            "unlocked_achievements": [
                {
                    "id": item.id,
                    "name": item.name,
                    "description": item.description,
                    "icon": item.icon,
                    "xp_reward": item.xp_reward,
                }
                for item in unlocked
            ],
        }
    )


@router.delete(
    "/{habit_id}/complete",
    status_code=status.HTTP_204_NO_CONTENT,
    summary="Отменить отметку выполнения",
)
def uncomplete_habit(
    habit_id: int,
    target_date: dt_date | None = Query(
        None,
        alias="date",
        description="Дата отметки, ГГГГ-ММ-ДД. Если параметр не указан — сегодня",
    ),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> Response:
    """Отменить отметку выполнения за указанную дату (по умолчанию — за сегодня).

    Параметр ``date`` необязателен, как и у отметки выполнения: вызов без
    параметра отменяет отметку за текущую дату.
    """
    habit = _get_owned_habit(db, habit_id, current_user)
    moment = target_date or now().date()

    completion = db.scalar(
        select(HabitCompletion).where(
            HabitCompletion.habit_id == habit.id,
            HabitCompletion.completion_date == moment,
        )
    )
    if completion is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Отметка выполнения за эту дату не найдена",
        )

    add_xp(current_user, -completion.xp_earned)
    db.delete(completion)
    db.commit()
    return Response(status_code=status.HTTP_204_NO_CONTENT)


@router.get(
    "/{habit_id}/completions",
    response_model=CompletionListOut,
    summary="История выполнения привычки",
)
def list_habit_completions(
    habit_id: int,
    date_from: dt_date | None = Query(
        None, description="Начало периода, ГГГГ-ММ-ДД (включительно)"
    ),
    date_to: dt_date | None = Query(
        None, description="Конец периода, ГГГГ-ММ-ДД (включительно)"
    ),
    limit: int = Query(50, ge=1, le=200, description="Размер страницы"),
    offset: int = Query(0, ge=0, description="Смещение"),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> CompletionListOut:
    """История выполнения одной привычки, новые отметки — первыми.

    Поддерживается необязательный фильтр по периоду ``date_from`` / ``date_to``;
    ``total`` всегда отражает количество отметок с учётом фильтра.
    """
    habit = _get_owned_habit(db, habit_id, current_user)

    filters = [HabitCompletion.habit_id == habit.id]
    if date_from is not None:
        filters.append(HabitCompletion.completion_date >= date_from)
    if date_to is not None:
        filters.append(HabitCompletion.completion_date <= date_to)

    total = int(
        db.scalar(
            select(func.count()).select_from(HabitCompletion).where(*filters)
        )
        or 0
    )
    rows = db.scalars(
        select(HabitCompletion)
        .where(*filters)
        .order_by(HabitCompletion.completed_at.desc(), HabitCompletion.id.desc())
        .limit(limit)
        .offset(offset)
    ).all()

    return CompletionListOut.model_validate(
        {
            "items": [
                {
                    "id": item.id,
                    "habit_id": item.habit_id,
                    "completed_at": item.completed_at,
                    "xp_earned": item.xp_earned,
                }
                for item in rows
            ],
            "total": total,
        }
    )
