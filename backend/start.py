"""Точка входа для публикации на хостинге (Amvera Cloud, Docker и другие).

Хостинги запускают приложение одной командой. Здесь по порядку выполняется всё,
что нужно для рабочей базы данных:

1. применяются миграции Alembic — схема приводится к актуальной;
2. загружаются тестовые данные (скрипт идемпотентен, повторный запуск
   ничего не дублирует);
3. запускается сервер uvicorn на порту, который задаёт хостинг.

Локальный запуск для разработки по-прежнему выполняется командой
``uvicorn app.main:app --reload`` — этот файл нужен только на хостинге.
"""

from __future__ import annotations

import os
import subprocess
import sys

import uvicorn

#: Порт по умолчанию. Совпадает со значением containerPort в amvera.yml.
DEFAULT_PORT = 5000


def run_step(command: list[str]) -> None:
    """Выполнить шаг подготовки и остановиться при ошибке."""
    print("+ " + " ".join(command), flush=True)
    subprocess.run(command, check=True)  # noqa: S603 — команды заданы в коде


def main() -> None:
    """Подготовить базу данных и запустить сервер."""
    run_step([sys.executable, "-m", "alembic", "upgrade", "head"])
    run_step([sys.executable, "-m", "app.seed"])

    port = int(os.environ.get("PORT", DEFAULT_PORT))
    print(f"Запуск сервера на порту {port}", flush=True)
    uvicorn.run("app.main:app", host="0.0.0.0", port=port)  # noqa: S104 — нужен доступ извне


if __name__ == "__main__":
    main()
