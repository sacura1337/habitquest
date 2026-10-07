"""Категории привычек."""

from __future__ import annotations

from fastapi import APIRouter, Depends
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.models.category import Category
from app.schemas.category import CategoryOut

router = APIRouter(prefix="/categories", tags=["Категории"])


@router.get("", response_model=list[CategoryOut], summary="Список категорий привычек")
def list_categories(db: Session = Depends(get_db)) -> list[CategoryOut]:
    """Вернуть справочник категорий привычек."""
    categories = db.scalars(select(Category).order_by(Category.id)).all()
    return [CategoryOut.model_validate(item) for item in categories]
