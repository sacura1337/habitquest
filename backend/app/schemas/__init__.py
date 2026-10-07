"""Схемы запросов и ответов (Pydantic v2)."""

from app.schemas.achievement import (
    AchievementBrief,
    AchievementOut,
    AchievementProgress,
)
from app.schemas.auth import LoginRequest, RegisterRequest, TokenResponse
from app.schemas.category import CategoryOut
from app.schemas.habit import (
    CompletionListOut,
    CompletionOut,
    CompleteRequest,
    CompleteResponse,
    HabitCreate,
    HabitDetailOut,
    HabitListOut,
    HabitOut,
    HabitUpdate,
)
from app.schemas.statistics import (
    CategoryStat,
    HistoryItemOut,
    HistoryOut,
    ProgressPoint,
    SummaryOut,
)
from app.schemas.user import LevelProgress, UserOut, UserStatsOut, UserUpdate

__all__ = [
    "AchievementBrief",
    "AchievementOut",
    "AchievementProgress",
    "CategoryOut",
    "CategoryStat",
    "CompleteRequest",
    "CompleteResponse",
    "CompletionListOut",
    "CompletionOut",
    "HabitCreate",
    "HabitDetailOut",
    "HabitListOut",
    "HabitOut",
    "HabitUpdate",
    "HistoryItemOut",
    "HistoryOut",
    "LevelProgress",
    "LoginRequest",
    "ProgressPoint",
    "RegisterRequest",
    "SummaryOut",
    "TokenResponse",
    "UserOut",
    "UserStatsOut",
    "UserUpdate",
]
