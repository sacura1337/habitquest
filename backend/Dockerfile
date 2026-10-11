# Образ для запуска серверной части HabitQuest в контейнере.
# Подходит любому хостингу с поддержкой Docker, включая Amvera Cloud.
#
# Сборка:   docker build -t habitquest-api .
# Запуск:   docker run -p 8000:8000 --env-file .env habitquest-api

FROM python:3.12-slim

# Не создавать файлы .pyc и не буферизовать вывод — логи видны сразу.
ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1 \
    PIP_NO_CACHE_DIR=1 \
    PYTHONPATH=/app

WORKDIR /app

# Сначала только зависимости: слой кэшируется, и пересборка после правок
# в коде идёт быстро.
COPY requirements.txt ./
RUN pip install --no-cache-dir -r requirements.txt

COPY . .

# Каталог для загруженных аватаров должен существовать до старта приложения.
RUN mkdir -p /app/uploads

EXPOSE 8000

# Порт берётся из переменной PORT, если её задаёт хостинг.
# Миграции и тестовые данные применяются при каждом запуске: оба скрипта
# идемпотентны, повторный запуск ничего не дублирует.
CMD ["sh", "-c", "alembic upgrade head && python -m app.seed && uvicorn app.main:app --host 0.0.0.0 --port ${PORT:-8000}"]
