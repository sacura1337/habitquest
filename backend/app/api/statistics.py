"""Статистика выполнения привычек."""

from __future__ import annotations

from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session

from app.api.auth import get_current_user
from app.core.database import get_db
from app.models.user import User
from app.schemas.statistics import HistoryOut, Period, ProgressPoint, SummaryOut
from app.services import statistics as statistics_service

router = APIRouter(prefix="/statistics", tags=["Статистика"])


@router.get("/summary", response_model=SummaryOut, summary="Сводка за период")
def get_summary(
    period: Period = Query("week", description="Период сводки: day, week или month"),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> SummaryOut:
    """Сводка выполнения привычек за день, неделю или месяц."""
    return SummaryOut.model_validate(statistics_service.summary(db, current_user, period))


@router.get("/progress", response_model=list[ProgressPoint], summary="Точки графика выполнения")
def get_progress(
    days: int = Query(30, ge=1, le=365, description="Количество дней графика"),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> list[ProgressPoint]:
    """Точки графика выполнения по дням за последние ``days`` дней."""
    return [
        ProgressPoint.model_validate(point)
        for point in statistics_service.progress(db, current_user, days)
    ]


@router.get("/history", response_model=HistoryOut, summary="История выполнения")
def get_history(
    limit: int = Query(20, ge=1, le=100, description="Размер страницы"),
    offset: int = Query(0, ge=0, description="Смещение"),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> HistoryOut:
    """История выполнения всех привычек пользователя, новые отметки — первыми."""
    return HistoryOut.model_validate(
        statistics_service.history(db, current_user, limit=limit, offset=offset)
    )
