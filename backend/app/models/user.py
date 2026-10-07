"""Модель пользователя (таблица ``users``)."""

from __future__ import annotations

from datetime import datetime
from typing import TYPE_CHECKING

from sqlalchemy import DateTime, Integer, String
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.database import Base, now
from app.services.gamification import level_threshold

if TYPE_CHECKING:
    from app.models.habit import Habit
    from app.models.user_achievement import UserAchievement


class User(Base):
    """Зарегистрированный пользователь приложения."""

    __tablename__ = "users"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    username: Mapped[str] = mapped_column(String(50), nullable=False)
    email: Mapped[str] = mapped_column(String(255), nullable=False, unique=True, index=True)
    password_hash: Mapped[str] = mapped_column(String(255), nullable=False)
    xp: Mapped[int] = mapped_column(Integer, nullable=False, default=0, server_default="0")
    level: Mapped[int] = mapped_column(Integer, nullable=False, default=1, server_default="1")
    avatar_url: Mapped[str | None] = mapped_column(String(500), nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, nullable=False, default=now)

    habits: Mapped[list[Habit]] = relationship(
        "Habit",
        back_populates="user",
        cascade="all, delete-orphan",
        passive_deletes=True,
    )
    achievement_links: Mapped[list[UserAchievement]] = relationship(
        "UserAchievement",
        back_populates="user",
        cascade="all, delete-orphan",
        passive_deletes=True,
    )

    # --- Удобные вычисляемые свойства ------------------------------------
    @property
    def xp_to_next_level(self) -> int:
        """Сколько XP осталось до следующего уровня."""
        return max(0, level_threshold(self.level + 1) - self.xp)

    def __repr__(self) -> str:  # pragma: no cover - отладочное представление
        return f"<User id={self.id} email={self.email!r} level={self.level}>"
