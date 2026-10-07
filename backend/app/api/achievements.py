"""Достижения пользователя."""

from __future__ import annotations

from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.api.auth import get_current_user
from app.core.database import get_db
from app.models.user import User
from app.schemas.achievement import AchievementOut
from app.services.achievements import achievements_with_progress

router = APIRouter(prefix="/achievements", tags=["Достижения"])


@router.get("", response_model=list[AchievementOut], summary="Все достижения с прогрессом")
def list_achievements(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> list[AchievementOut]:
    """Вернуть все достижения: полученные и доступные, с прогрессом."""
    return [
        AchievementOut.model_validate(item)
        for item in achievements_with_progress(db, current_user)
    ]


@router.get(
    "/unlocked",
    response_model=list[AchievementOut],
    summary="Только полученные достижения",
)
def list_unlocked_achievements(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> list[AchievementOut]:
    """Вернуть только полученные пользователем достижения."""
    return [
        AchievementOut.model_validate(item)
        for item in achievements_with_progress(db, current_user, only_unlocked=True)
    ]
