"""Точка входа для публикации на хостинге (Amvera Cloud, Docker и другие).

Хостинги запускают приложение одной командой. Здесь по порядку выполняется всё,
что нужно для рабочей базы данных:

1. проверяется, готова ли база (файл на месте, схема создана, данные есть);
2. если база готова — подготовка пропускается, сервер стартует сразу;
3. иначе применяются миграции Alembic и загружаются тестовые данные;
4. запускается сервер uvicorn на порту, который задаёт хостинг.

Проверка базы ускоряет перезапуск: полная подготовка занимает больше минуты,
а на готовой базе запуск происходит за секунды. Это важно на хостинге, где
приложение недоступно всё время подготовки.

Локальный запуск для разработки по-прежнему выполняется командой
``uvicorn app.main:app --reload`` — этот файл нужен только на хостинге.
"""

from __future__ import annotations

import os
import subprocess
import sys

import uvicorn
from sqlalchemy import inspect, text

from app.core.config import settings
from app.core.database import engine

#: Порт по умолчанию. Совпадает со значением containerPort в amvera.yml.
DEFAULT_PORT = 5000


def run_step(command: list[str]) -> None:
    """Выполнить шаг подготовки и остановиться при ошибке."""
    print("+ " + " ".join(command), flush=True)
    subprocess.run(command, check=True)  # noqa: S603 — команды заданы в коде


def database_is_ready() -> bool:
    """Проверить, что схема создана и данные уже загружены.

    Любая неожиданность (нет файла, нет таблиц, пустая база) означает, что
    базу нужно подготовить заново, поэтому ошибка здесь не прерывает запуск.
    """
    try:
        if "users" not in inspect(engine).get_table_names():
            return False
        with engine.connect() as connection:
            users = connection.execute(text("SELECT COUNT(*) FROM users")).scalar()
        return bool(users)
    except Exception as error:  # noqa: BLE001 — любая причина означает «не готова»
        print(f"База не готова ({type(error).__name__}), выполняется подготовка", flush=True)
        return False


def main() -> None:
    """Подготовить базу данных и запустить сервер."""
    persistent = "есть" if settings.uses_persistent_storage else "нет"
    print(f"База данных: {settings.database_path}", flush=True)
    print(f"Постоянное хранилище: {persistent}", flush=True)

    if database_is_ready():
        print("База уже подготовлена: миграции и наполнение пропущены", flush=True)
    else:
        run_step([sys.executable, "-m", "alembic", "upgrade", "head"])
        run_step([sys.executable, "-m", "app.seed"])

    port = int(os.environ.get("PORT", DEFAULT_PORT))
    print(f"Запуск сервера на порту {port}", flush=True)
    uvicorn.run("app.main:app", host="0.0.0.0", port=port)  # noqa: S104 — нужен доступ извне


if __name__ == "__main__":
    main()
