"""Подключение к базе данных: engine, фабрика сессий, декларативная база.

Все запросы к БД выполняются только через ORM SQLAlchemy с параметризацией —
конкатенация строк в SQL не используется, что исключает SQL-инъекции.
"""

from __future__ import annotations

from collections.abc import Generator
from datetime import datetime

from sqlalchemy import create_engine, event
from sqlalchemy.orm import DeclarativeBase, Session, sessionmaker

from app.core.config import settings


def now() -> datetime:
    """Текущее время приложения (локальное время сервера, без микросекунд).

    Единые «часы приложения» используются и при расчёте серий, и при
    определении «сегодня», поэтому формат дат в API всегда согласован.
    """
    return datetime.now().replace(microsecond=0)


#: Аргументы подключения. Для SQLite отключаем проверку потока,
#: так как FastAPI обрабатывает запросы в пуле потоков.
connect_args: dict[str, object] = {}
if settings.is_sqlite:
    connect_args["check_same_thread"] = False

engine = create_engine(
    settings.DATABASE_URL,
    connect_args=connect_args,
    future=True,
    pool_pre_ping=True,
)

if settings.is_sqlite:

    @event.listens_for(engine, "connect")
    def _set_sqlite_pragma(dbapi_connection, connection_record) -> None:  # noqa: ANN001
        """Включаем контроль внешних ключей для SQLite (по умолчанию выключен)."""
        cursor = dbapi_connection.cursor()
        cursor.execute("PRAGMA foreign_keys=ON")
        cursor.close()


class Base(DeclarativeBase):
    """Декларативная база SQLAlchemy 2.0 для всех моделей проекта."""


SessionLocal = sessionmaker(
    bind=engine,
    class_=Session,
    autoflush=False,
    autocommit=False,
    expire_on_commit=False,
)


def get_db() -> Generator[Session, None, None]:
    """Зависимость FastAPI: сессия БД на время обработки одного запроса."""
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
