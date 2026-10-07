"""Модель категории привычек (таблица ``categories``)."""

from __future__ import annotations

from typing import TYPE_CHECKING

from sqlalchemy import Integer, String
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.database import Base

if TYPE_CHECKING:
    from app.models.habit import Habit


class Category(Base):
    """Категория привычек (Здоровье, Спорт, Образование и т. д.)."""

    __tablename__ = "categories"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    name: Mapped[str] = mapped_column(String(50), nullable=False)
    slug: Mapped[str] = mapped_column(String(50), nullable=False, unique=True, index=True)
    color: Mapped[str] = mapped_column(String(9), nullable=False, default="#6366F1")
    icon: Mapped[str] = mapped_column(String(50), nullable=False, default="circle")

    habits: Mapped[list[Habit]] = relationship("Habit", back_populates="category")

    def __repr__(self) -> str:  # pragma: no cover
        return f"<Category id={self.id} slug={self.slug!r}>"
