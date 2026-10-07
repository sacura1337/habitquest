"""Модель достижения (таблица ``achievements``)."""

from __future__ import annotations

from typing import TYPE_CHECKING

from sqlalchemy import Integer, String, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.database import Base

if TYPE_CHECKING:
    from app.models.user_achievement import UserAchievement


class Achievement(Base):
    """Достижение (ачивка) и условие его получения."""

    __tablename__ = "achievements"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    code: Mapped[str] = mapped_column(String(50), nullable=False, unique=True, index=True)
    name: Mapped[str] = mapped_column(String(100), nullable=False)
    description: Mapped[str] = mapped_column(Text, nullable=False, default="")
    icon: Mapped[str] = mapped_column(String(50), nullable=False, default="award")
    xp_reward: Mapped[int] = mapped_column(Integer, nullable=False, default=0)
    target: Mapped[int] = mapped_column(Integer, nullable=False, default=1)
    condition_type: Mapped[str] = mapped_column(String(50), nullable=False)

    user_links: Mapped[list[UserAchievement]] = relationship(
        "UserAchievement", back_populates="achievement"
    )

    def __repr__(self) -> str:  # pragma: no cover
        return f"<Achievement id={self.id} code={self.code!r}>"
