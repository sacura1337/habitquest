"""Модель привычки (таблица ``habits``)."""

from __future__ import annotations

from datetime import datetime, time
from typing import TYPE_CHECKING

from sqlalchemy import (
    Boolean,
    CheckConstraint,
    DateTime,
    ForeignKey,
    Integer,
    String,
    Text,
    Time,
)
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.database import Base, now

if TYPE_CHECKING:
    from app.models.category import Category
    from app.models.habit_completion import HabitCompletion
    from app.models.user import User


class Habit(Base):
    """Привычка пользователя."""

    __tablename__ = "habits"
    __table_args__ = (
        CheckConstraint(
            "difficulty IN ('easy', 'medium', 'hard')",
            name="ck_habits_difficulty",
        ),
        CheckConstraint(
            "frequency IN ('daily', 'weekly', 'monthly')",
            name="ck_habits_frequency",
        ),
    )

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    user_id: Mapped[int] = mapped_column(
        ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True
    )
    name: Mapped[str] = mapped_column(String(100), nullable=False)
    description: Mapped[str | None] = mapped_column(Text, nullable=True)
    category_id: Mapped[int] = mapped_column(
        ForeignKey("categories.id", ondelete="CASCADE"), nullable=False, index=True
    )
    difficulty: Mapped[str] = mapped_column(String(10), nullable=False, default="medium")
    frequency: Mapped[str] = mapped_column(String(10), nullable=False, default="daily")
    reminder_time: Mapped[time | None] = mapped_column(Time, nullable=True)
    is_active: Mapped[bool] = mapped_column(Boolean, nullable=False, default=True, server_default="1")
    created_at: Mapped[datetime] = mapped_column(DateTime, nullable=False, default=now)

    user: Mapped[User] = relationship("User", back_populates="habits")
    category: Mapped[Category] = relationship("Category", back_populates="habits")
    completions: Mapped[list[HabitCompletion]] = relationship(
        "HabitCompletion",
        back_populates="habit",
        cascade="all, delete-orphan",
        passive_deletes=True,
        order_by="HabitCompletion.completion_date",
    )

    def __repr__(self) -> str:  # pragma: no cover
        return f"<Habit id={self.id} name={self.name!r}>"
