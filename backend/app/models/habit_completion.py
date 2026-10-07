"""Модель отметки выполнения привычки (таблица ``habit_completions``)."""

from __future__ import annotations

from datetime import date, datetime
from typing import TYPE_CHECKING

from sqlalchemy import Date, DateTime, ForeignKey, Integer, UniqueConstraint
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.database import Base, now

if TYPE_CHECKING:
    from app.models.habit import Habit


class HabitCompletion(Base):
    """Факт выполнения привычки.

    Дополнительная колонка ``completion_date`` хранит календарную дату
    выполнения (без времени) и обеспечивает уникальность пары
    ``(habit_id, дата)`` — повторная отметка за одну дату невозможна.
    """

    __tablename__ = "habit_completions"
    __table_args__ = (
        UniqueConstraint("habit_id", "completion_date", name="uq_habit_completions_habit_date"),
    )

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    habit_id: Mapped[int] = mapped_column(
        ForeignKey("habits.id", ondelete="CASCADE"), nullable=False, index=True
    )
    completed_at: Mapped[datetime] = mapped_column(DateTime, nullable=False, default=now)
    completion_date: Mapped[date] = mapped_column(Date, nullable=False, index=True)
    xp_earned: Mapped[int] = mapped_column(Integer, nullable=False, default=0)

    habit: Mapped[Habit] = relationship("Habit", back_populates="completions")

    def __repr__(self) -> str:  # pragma: no cover
        return f"<HabitCompletion id={self.id} habit_id={self.habit_id} date={self.completion_date}>"
