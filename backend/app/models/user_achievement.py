"""Модель связи «пользователь — достижение» (таблица ``user_achievements``)."""

from __future__ import annotations

from datetime import datetime
from typing import TYPE_CHECKING

from sqlalchemy import DateTime, ForeignKey, Integer, UniqueConstraint
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.database import Base, now

if TYPE_CHECKING:
    from app.models.achievement import Achievement
    from app.models.user import User


class UserAchievement(Base):
    """Полученное пользователем достижение."""

    __tablename__ = "user_achievements"
    __table_args__ = (
        UniqueConstraint("user_id", "achievement_id", name="uq_user_achievements_user_achievement"),
    )

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    user_id: Mapped[int] = mapped_column(
        ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True
    )
    achievement_id: Mapped[int] = mapped_column(
        ForeignKey("achievements.id", ondelete="CASCADE"), nullable=False, index=True
    )
    unlocked_at: Mapped[datetime] = mapped_column(DateTime, nullable=False, default=now)

    user: Mapped[User] = relationship("User", back_populates="achievement_links")
    achievement: Mapped[Achievement] = relationship("Achievement", back_populates="user_links")

    def __repr__(self) -> str:  # pragma: no cover
        return f"<UserAchievement user_id={self.user_id} achievement_id={self.achievement_id}>"
