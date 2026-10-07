"""Настройки приложения.

Значения читаются из переменных окружения и из файла ``backend/.env``
(библиотека ``pydantic-settings``). Любое значение можно переопределить
переменной окружения — она имеет приоритет над файлом ``.env``.
"""

from __future__ import annotations

from functools import lru_cache
from pathlib import Path

from pydantic_settings import BaseSettings, SettingsConfigDict

#: Корень серверной части проекта (папка ``backend/``).
BASE_DIR: Path = Path(__file__).resolve().parents[2]


class Settings(BaseSettings):
    """Конфигурация серверной части HabitQuest."""

    model_config = SettingsConfigDict(
        env_file=str(BASE_DIR / ".env"),
        env_file_encoding="utf-8",
        case_sensitive=False,
        extra="ignore",
    )

    # --- База данных -----------------------------------------------------
    #: Строка подключения SQLAlchemy. По умолчанию — SQLite-файл рядом с backend/.
    DATABASE_URL: str = "sqlite:///./habitquest.db"

    # --- Авторизация -----------------------------------------------------
    #: Секретный ключ для подписи JWT. В продакшене обязательно заменить.
    SECRET_KEY: str = "habitquest-dev-secret-key-change-me"
    #: Алгоритм подписи JWT.
    ALGORITHM: str = "HS256"
    #: Время жизни access-токена в минутах (по умолчанию 7 суток).
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 10080

    # --- Прочее ----------------------------------------------------------
    #: Список разрешённых источников CORS через запятую (``*`` — все).
    CORS_ORIGINS: str = (
        "http://localhost:5173,http://127.0.0.1:5173,"
        "http://localhost:3000,http://127.0.0.1:3000,"
        "http://localhost:4173,http://127.0.0.1:4173"
    )
    #: Каталог для загруженных файлов (относительный путь — от папки ``backend/``).
    UPLOAD_DIR: str = "uploads"
    #: Максимальный размер загружаемого аватара в байтах (2 МБ).
    MAX_AVATAR_SIZE: int = 2 * 1024 * 1024
    #: Название приложения (используется в документации Swagger).
    APP_NAME: str = "HabitQuest API"
    APP_VERSION: str = "1.0.0"

    @property
    def cors_origins(self) -> list[str]:
        """Список источников CORS в виде списка строк."""
        return [origin.strip() for origin in self.CORS_ORIGINS.split(",") if origin.strip()]

    @property
    def upload_path(self) -> Path:
        """Абсолютный путь к каталогу загруженных файлов."""
        path = Path(self.UPLOAD_DIR)
        if not path.is_absolute():
            path = BASE_DIR / path
        return path.resolve()

    @property
    def is_sqlite(self) -> bool:
        """``True``, если используется SQLite."""
        return self.DATABASE_URL.startswith("sqlite")


@lru_cache
def get_settings() -> Settings:
    """Вернуть единственный экземпляр настроек (кэшируется)."""
    return Settings()


settings = get_settings()
