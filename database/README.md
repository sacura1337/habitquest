# База данных HabitQuest

Документ описывает структуру базы данных трекера привычек с геймификацией,
связи между таблицами, порядок применения миграций и наполнения тестовыми
данными, а также переход на PostgreSQL.

Файл `schema.sql` в этом каталоге — дамп DDL созданной схемы (SQLite) с
комментариями на русском языке.

## 1. Общая информация

| Параметр | Значение |
| --- | --- |
| СУБД по умолчанию | SQLite 3 (файл `backend/habitquest.db`) |
| Альтернативная СУБД | PostgreSQL 14+ (драйвер `psycopg`) |
| Доступ к данным | только ORM SQLAlchemy 2.0 с параметризацией запросов |
| Миграции | Alembic (`backend/alembic`) |
| Количество таблиц | 6 пользовательских + служебная `alembic_version` |
| Внешние ключи | все объявлены с `ON DELETE CASCADE` |
| Контроль ссылочной целостности в SQLite | `PRAGMA foreign_keys=ON` при каждом подключении |

Дата и время хранятся в полях типа `DATETIME` без часового пояса — это
локальное время сервера («часы приложения», см. функцию `now()` в
`backend/app/core/database.py`). Время напоминания хранится в поле типа `TIME`.
Такой подход даёт согласованные календарные даты при расчёте серий, графика
выполнения и достижений.

## 2. Состав таблиц

### 2.1 `users` — пользователи

Назначение: учётные записи, накопленный опыт и уровень.

| Поле | Тип | Ограничения | Описание |
| --- | --- | --- | --- |
| `id` | INTEGER | PK, AUTOINCREMENT | Идентификатор |
| `username` | VARCHAR(50) | NOT NULL | Отображаемое имя |
| `email` | VARCHAR(255) | NOT NULL, UNIQUE | E-mail (используется как логин) |
| `password_hash` | VARCHAR(255) | NOT NULL | Хеш пароля bcrypt; открытый пароль не хранится |
| `xp` | INTEGER | NOT NULL, DEFAULT 0 | Накопленный опыт |
| `level` | INTEGER | NOT NULL, DEFAULT 1 | Текущий уровень |
| `avatar_url` | VARCHAR(500) | NULL | Путь к аватару `/uploads/<uuid>.<ext>` |
| `created_at` | DATETIME | NOT NULL | Дата и время регистрации |

Индексы: `ix_users_email` (уникальный).

### 2.2 `categories` — категории привычек

Назначение: тематическая группировка привычек.

| Поле | Тип | Ограничения | Описание |
| --- | --- | --- | --- |
| `id` | INTEGER | PK, AUTOINCREMENT | Идентификатор |
| `name` | VARCHAR(50) | NOT NULL | Название («Здоровье», «Спорт», …) |
| `slug` | VARCHAR(50) | NOT NULL, UNIQUE | Латинский идентификатор (`health`, `sport`, …) |
| `color` | VARCHAR(9) | NOT NULL | Цвет `#RRGGBB` из палитры `docs/DESIGN-SYSTEM.md` |
| `icon` | VARCHAR(50) | NOT NULL | Имя иконки интерфейса |

Индексы: `ix_categories_slug` (уникальный).

### 2.3 `habits` — привычки пользователей

Назначение: параметры отслеживаемой привычки.

| Поле | Тип | Ограничения | Описание |
| --- | --- | --- | --- |
| `id` | INTEGER | PK, AUTOINCREMENT | Идентификатор |
| `user_id` | INTEGER | NOT NULL, FK → `users.id` ON DELETE CASCADE | Владелец привычки |
| `name` | VARCHAR(100) | NOT NULL | Название привычки |
| `description` | TEXT | NULL | Подробное описание |
| `category_id` | INTEGER | NOT NULL, FK → `categories.id` ON DELETE CASCADE | Категория |
| `difficulty` | VARCHAR(10) | NOT NULL, CHECK | `easy` / `medium` / `hard` |
| `frequency` | VARCHAR(10) | NOT NULL, CHECK | `daily` / `weekly` / `monthly` |
| `reminder_time` | TIME | NULL | Время напоминания |
| `is_active` | BOOLEAN | NOT NULL, DEFAULT 1 | Активна ли привычка |
| `created_at` | DATETIME | NOT NULL | Дата и время создания |

Ограничения: `ck_habits_difficulty`, `ck_habits_frequency`.
Индексы: `ix_habits_user_id`, `ix_habits_category_id`.

### 2.4 `habit_completions` — история выполнения

Назначение: факт выполнения привычки в конкретную дату и начисленный опыт.

| Поле | Тип | Ограничения | Описание |
| --- | --- | --- | --- |
| `id` | INTEGER | PK, AUTOINCREMENT | Идентификатор |
| `habit_id` | INTEGER | NOT NULL, FK → `habits.id` ON DELETE CASCADE | Привычка |
| `completed_at` | DATETIME | NOT NULL | Дата и время отметки |
| `completion_date` | DATE | NOT NULL | Календарная дата отметки (без времени) |
| `xp_earned` | INTEGER | NOT NULL | Начислено XP (базовый + бонус за серию) |

Ограничения: `uq_habit_completions_habit_date` — уникальность пары
`(habit_id, completion_date)`.

> **Почему добавлено поле `completion_date`.** Контракт API требует запрещать
> повторную отметку привычки за одну дату, то есть уникальность пары
> «привычка + дата». Ограничение на выражение `date(completed_at)` невозможно
> перенести на PostgreSQL (приведение `timestamptz → date` не является
> immutable-функцией), поэтому дата хранится отдельной колонкой типа `DATE`.
> Это делает ограничение переносимым и позволяет строить индекс по дате.

Индексы: `ix_habit_completions_habit_id`, `ix_habit_completions_completion_date`.

### 2.5 `achievements` — справочник достижений

Назначение: описание условий получения достижений и награды за них.

| Поле | Тип | Ограничения | Описание |
| --- | --- | --- | --- |
| `id` | INTEGER | PK, AUTOINCREMENT | Идентификатор |
| `code` | VARCHAR(50) | NOT NULL, UNIQUE | Машинный код (`first_habit`, `streak_7`, …) |
| `name` | VARCHAR(100) | NOT NULL | Название достижения |
| `description` | TEXT | NOT NULL | Описание условия |
| `icon` | VARCHAR(50) | NOT NULL | Имя иконки интерфейса |
| `xp_reward` | INTEGER | NOT NULL | Награда в XP |
| `target` | INTEGER | NOT NULL | Целевое значение условия |
| `condition_type` | VARCHAR(50) | NOT NULL | Тип условия (см. ниже) |

Типы условий (`condition_type`): `total_completions` — всего выполнений,
`best_streak` — лучшая серия, `total_habits` — количество привычек,
`level` — уровень, `completions_in_day` — выполнений за один день,
`early_completion` — отметка до 08:00, `categories_covered` — охват категорий.

Индексы: `ix_achievements_code` (уникальный).

### 2.6 `user_achievements` — полученные достижения

Назначение: связь «многие ко многим» между пользователями и достижениями.

| Поле | Тип | Ограничения | Описание |
| --- | --- | --- | --- |
| `id` | INTEGER | PK, AUTOINCREMENT | Идентификатор |
| `user_id` | INTEGER | NOT NULL, FK → `users.id` ON DELETE CASCADE | Пользователь |
| `achievement_id` | INTEGER | NOT NULL, FK → `achievements.id` ON DELETE CASCADE | Достижение |
| `unlocked_at` | DATETIME | NOT NULL | Дата и время получения |

Ограничения: `uq_user_achievements_user_achievement` — уникальность пары
`(user_id, achievement_id)`.

Индексы: `ix_user_achievements_user_id`, `ix_user_achievements_achievement_id`.

### 2.7 `alembic_version` — служебная таблица

Хранит идентификатор применённой ревизии (`version_num`). Создаётся Alembic
автоматически; вручную изменять не нужно.

## 3. Связи между таблицами

```
users 1 ──── N habits ──── N habit_completions
                  │
                  N
                  │
                  1
              categories

users 1 ──── N user_achievements N ──── 1 achievements
```

| Связь | Тип | Правило удаления |
| --- | --- | --- |
| `users` → `habits` | 1:N | CASCADE: удаление пользователя удаляет его привычки |
| `categories` → `habits` | 1:N | CASCADE |
| `habits` → `habit_completions` | 1:N | CASCADE: удаление привычки удаляет её историю |
| `users` → `user_achievements` | 1:N | CASCADE |
| `achievements` → `user_achievements` | 1:N | CASCADE |

Логическая модель «многие ко многим» между `users` и `achievements`
реализована через таблицу связи `user_achievements`.

## 4. Как применить миграции и загрузить тестовые данные

Все команды выполняются из каталога `backend` в активированном виртуальном
окружении.

```powershell
cd backend
.venv\Scripts\Activate.ps1          # или используйте .venv\Scripts\python.exe напрямую

# 1. Применить все миграции (создать таблицы)
python -m alembic upgrade head

# 2. Наполнить базу тестовыми данными (идемпотентно)
python -m app.seed

# 3. Запустить сервер
python -m uvicorn app.main:app --port 8000
```

Полезные команды Alembic:

```powershell
python -m alembic current                 # текущая ревизия
python -m alembic history                 # список миграций
python -m alembic downgrade base          # откатить всё
python -m alembic revision --autogenerate -m "описание"   # новая миграция
```

Начальная миграция: `backend/alembic/versions/892e25561b81_initial_schema.py`.

### Что создаёт seed-скрипт

| Объект | Количество |
| --- | --- |
| Категории | 8 (Здоровье, Спорт, Образование, Работа, Саморазвитие, Дом, Финансы, Отдых) |
| Достижения | 12 (полный набор из `docs/API.md`) |
| Пользователи | 3 |
| Привычки | 15 |
| Отметки выполнения | более 400 за последние 60 дней |
| Полученные достижения | рассчитываются по фактическим данным |

Тестовый аккаунт: **demo@habitquest.ru / demo1234** (имя «Михаил»).

Повторный запуск `python -m app.seed` не создаёт дубликатов: категории
сверяются по `slug`, пользователи — по `email`, достижения — по `code`,
привычки — по паре «пользователь + название», отметки — по паре
«привычка + дата». XP и уровни пользователей пересчитываются из фактических
отметок, поэтому повторный запуск не искажает статистику.

## 5. Переход на PostgreSQL

1. Установите PostgreSQL и создайте базу и пользователя:

   ```sql
   CREATE DATABASE habitquest;
   CREATE USER habitquest WITH PASSWORD 'habitquest';
   GRANT ALL PRIVILEGES ON DATABASE habitquest TO habitquest;
   ```

2. Установите драйвер (он уже в `requirements.txt`):

   ```powershell
   pip install "psycopg[binary]"
   ```

3. В файле `backend/.env` замените строку подключения:

   ```env
   DATABASE_URL=postgresql+psycopg://habitquest:habitquest@localhost:5432/habitquest
   ```

4. Примените миграции и загрузите данные:

   ```powershell
   python -m alembic upgrade head
   python -m app.seed
   ```

Дополнительных изменений в коде не требуется:

* модели описаны SQLAlchemy 2.0 без диалект-специфичных конструкций;
* `PRAGMA foreign_keys=ON` включается только для SQLite (`app/core/database.py`);
* миграции используют `render_as_batch`, что не мешает PostgreSQL;
* пароли, JWT, уникальные ограничения и внешние ключи работают одинаково.

При работе с PostgreSQL рекомендуется дополнительно включить пул соединений
(`pool_size`, `max_overflow`) в `create_engine`, если нагрузка превышает
возможности одиночного подключения.

## 6. Проверка схемы

Файл `schema.sql` можно применить к пустой базе SQLite, чтобы убедиться, что
дамп самодостаточен:

```powershell
# Вариант 1: через консольный клиент sqlite3 (если установлен)
sqlite3 test.db ".read database/schema.sql"
sqlite3 test.db ".tables"

# Вариант 2: только средствами Python (модуль sqlite3 из стандартной библиотеки)
python -c "import sqlite3,pathlib; c=sqlite3.connect('test.db'); c.executescript(pathlib.Path('database/schema.sql').read_text(encoding='utf-8')); print([r[0] for r in c.execute(\"SELECT name FROM sqlite_master WHERE type='table' ORDER BY name\")])"
```

Ожидаемый список таблиц: `achievements`, `alembic_version`, `categories`,
`habit_completions`, `habits`, `user_achievements`, `users`.
