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

#: Каталог постоянного хранилища хостинга (Amvera Cloud).
#: Всё, что лежит здесь, переживает пересборку и перезапуск приложения.
#: Локально такого каталога нет, поэтому используется папка проекта.
PERSISTENT_DIR: Path = Path("/data")


class Settings(BaseSettings):
    """Конфигурация серверной части HabitQuest."""

    model_config = SettingsConfigDict(
        env_file=str(BASE_DIR / ".env"),
        env_file_encoding="utf-8",
        case_sensitive=False,
        extra="ignore",
    )

    # --- База данных -----------------------------------------------------
    #: Строка подключения SQLAlchemy. Если не задана, путь выбирается сам:
    #: при наличии постоянного хранилища ``/data`` файл базы кладётся туда,
    #: иначе — рядом с папкой ``backend/`` (локальная разработка).
    #: Это важно на хостинге: файл вне ``/data`` стирается при пересборке,
    #: и созданные пользователи пропадают.
    DATABASE_URL: str | None = None

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
    def uses_persistent_storage(self) -> bool:
        """``True``, если доступно постоянное хранилище хостинга."""
        return PERSISTENT_DIR.is_dir()

    @property
    def upload_path(self) -> Path:
        """Абсолютный путь к каталогу загруженных файлов."""
        path = Path(self.UPLOAD_DIR)
        if not path.is_absolute():
            # На хостинге аватары тоже должны переживать пересборку.
            base = PERSISTENT_DIR if (self.UPLOAD_DIR == "uploads"
                                      and self.uses_persistent_storage) else BASE_DIR
            path = base / path
        return path.resolve()

    @property
    def database_url(self) -> str:
        """Строка подключения, приведённая к драйверу psycopg 3.

        Хостинги (Render, Railway, Neon, Supabase) выдают адрес базы в виде
        ``postgresql://...``. По такой схеме SQLAlchemy ищет драйвер psycopg2,
        которого нет в зависимостях проекта — установлен psycopg третьей версии.
        Поэтому схема приводится к явному виду ``postgresql+psycopg://``.
        """
        url = (self.DATABASE_URL or "").strip()
        if not url:
            url = self.default_database_url
        if url.startswith("postgres://"):
            url = "postgresql://" + url[len("postgres://") :]
        if url.startswith("postgresql://"):
            url = "postgresql+psycopg://" + url[len("postgresql://") :]
        return url

    @property
    def default_database_url(self) -> str:
        """Путь к базе по умолчанию, если строка подключения не задана.

        В постоянном хранилище (``/data``) — чтобы данные переживали
        пересборку; иначе — файл рядом с папкой ``backend/``.
        """
        if self.uses_persistent_storage:
            # Четыре слэша: три от схемы и один от абсолютного пути.
            return f"sqlite:///{PERSISTENT_DIR / 'habitquest.db'}"
        return "sqlite:///./habitquest.db"

    @property
    def database_path(self) -> str:
        """Путь к файлу базы для вывода в журнал (без секретов)."""
        url = self.database_url
        if url.startswith("sqlite"):
            return url.replace("sqlite:///", "", 1) or ":memory:"
        return "PostgreSQL (адрес скрыт)"

    @property
    def is_sqlite(self) -> bool:
        """``True``, если используется SQLite."""
        return self.database_url.startswith("sqlite")


@lru_cache
def get_settings() -> Settings:
    """Вернуть единственный экземпляр настроек (кэшируется)."""
    return Settings()


settings = get_settings()
