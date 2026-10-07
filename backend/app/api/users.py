"""Профиль пользователя: изменение данных, загрузка аватара, статистика."""

from __future__ import annotations

from pathlib import Path
from uuid import uuid4

from fastapi import APIRouter, Depends, File, HTTPException, UploadFile, status
from sqlalchemy.orm import Session

from app.api.auth import get_current_user
from app.core.config import settings
from app.core.database import get_db
from app.models.user import User
from app.schemas.user import LevelProgress, UserOut, UserStatsOut, UserUpdate
from app.services.achievements import unlocked_count
from app.services.gamification import level_progress, max_streak
from app.services.statistics import load_user_habits

router = APIRouter(prefix="/users", tags=["Пользователь"])

#: Разрешённые типы изображений и соответствующие им расширения файлов.
ALLOWED_IMAGE_TYPES: dict[str, str] = {
    "image/jpeg": ".jpg",
    "image/png": ".png",
    "image/webp": ".webp",
}

#: Сигнатуры («магические байты») разрешённых форматов.
IMAGE_SIGNATURES: dict[str, tuple[bytes, ...]] = {
    "image/jpeg": (b"\xff\xd8\xff",),
    "image/png": (b"\x89PNG\r\n\x1a\n",),
    "image/webp": (b"RIFF",),
}


def _human_size(size: int) -> str:
    """Размер файла в мегабайтах для сообщения об ошибке."""
    return f"{size / (1024 * 1024):.1f} МБ"


def _looks_like_image(content_type: str, data: bytes) -> bool:
    """Проверить содержимое файла по сигнатуре заявленного формата."""
    signatures = IMAGE_SIGNATURES.get(content_type, ())
    if content_type == "image/webp":
        return data[:4] == b"RIFF" and data[8:12] == b"WEBP"
    return any(data.startswith(signature) for signature in signatures)


def _remove_old_avatar(avatar_url: str | None, upload_dir: Path) -> None:
    """Удалить предыдущий файл аватара.

    Имя файла берётся из URL и обязательно проверяется: удаляем только файл,
    лежащий непосредственно в каталоге загрузок (защита от path traversal).
    """
    if not avatar_url or not avatar_url.startswith("/uploads/"):
        return
    name = Path(avatar_url).name
    if not name:
        return
    candidate = (upload_dir / name).resolve()
    if candidate.parent != upload_dir.resolve():
        return
    if candidate.is_file():
        try:
            candidate.unlink()
        except OSError:
            pass


@router.patch("/me", response_model=UserOut, summary="Изменить профиль")
def update_me(
    data: UserUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> UserOut:
    """Изменить имя пользователя и/или ссылку на аватар."""
    payload = data.model_dump(exclude_unset=True)
    if "username" in payload and payload["username"] is not None:
        current_user.username = payload["username"]
    if "avatar_url" in payload:
        current_user.avatar_url = payload["avatar_url"]

    db.commit()
    db.refresh(current_user)
    return UserOut.model_validate(current_user)


@router.post("/me/avatar", response_model=UserOut, summary="Загрузить аватар")
async def upload_avatar(
    file: UploadFile = File(..., description="Изображение JPEG, PNG или WebP, до 2 МБ"),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> UserOut:
    """Загрузить аватар пользователя.

    Тип файла определяется по ``Content-Type`` и проверяется по сигнатуре;
    имя файла генерируется через ``uuid4``, имя от клиента не используется.
    """
    if file.content_type not in ALLOWED_IMAGE_TYPES:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Разрешены только изображения JPEG, PNG и WebP",
        )

    data = await file.read(settings.MAX_AVATAR_SIZE + 1)
    if not data:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Файл пустой")
    if len(data) > settings.MAX_AVATAR_SIZE:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=(
                "Размер файла не должен превышать "
                f"{_human_size(settings.MAX_AVATAR_SIZE)}"
            ),
        )
    if not _looks_like_image(file.content_type, data):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Содержимое файла не соответствует формату изображения",
        )

    upload_dir = settings.upload_path
    upload_dir.mkdir(parents=True, exist_ok=True)

    filename = f"{uuid4().hex}{ALLOWED_IMAGE_TYPES[file.content_type]}"
    destination = (upload_dir / filename).resolve()
    if destination.parent != upload_dir:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST, detail="Недопустимое имя файла"
        )
    destination.write_bytes(data)

    _remove_old_avatar(current_user.avatar_url, upload_dir)
    current_user.avatar_url = f"/uploads/{filename}"

    db.commit()
    db.refresh(current_user)
    return UserOut.model_validate(current_user)


@router.get("/me/stats", response_model=UserStatsOut, summary="Статистика профиля")
def get_my_stats(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> UserStatsOut:
    """Сводная статистика профиля: привычки, выполнения, XP, уровень, достижения."""
    habits = load_user_habits(db, current_user)
    total_completions = sum(len(habit.completions) for habit in habits)
    best = 0
    for habit in habits:
        best = max(
            best,
            max_streak([item.completion_date for item in habit.completions], habit.frequency or "daily"),
        )

    progress = level_progress(current_user.xp)
    return UserStatsOut.model_validate(
        {
            "total_habits": len(habits),
            "active_habits": sum(1 for habit in habits if habit.is_active),
            "total_completions": total_completions,
            "xp": current_user.xp,
            "level": current_user.level,
            "level_progress": LevelProgress(**progress),
            "best_streak": best,
            "achievements_unlocked": unlocked_count(db, current_user),
        }
    )
