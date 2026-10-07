"""Схемы категорий привычек."""

from __future__ import annotations

from app.schemas.common import ORMModel


class CategoryOut(ORMModel):
    """Категория привычек."""

    id: int
    name: str
    slug: str
    color: str
    icon: str
