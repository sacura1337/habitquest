-- ===========================================================================
-- HabitQuest — схема базы данных (SQLite)
-- ===========================================================================
-- Структура соответствует миграции Alembic
-- backend/alembic/versions/892e25561b81_initial_schema.py
--
-- Как воспроизвести схему с нуля:
--   cd backend
--   .venv\Scripts\python -m alembic upgrade head
--   .venv\Scripts\python -m app.seed
--
-- Примечания:
--   * для SQLite включён режим PRAGMA foreign_keys=ON (см. app/core/database.py),
--     иначе СУБД не контролирует внешние ключи;
--   * все внешние ключи объявлены с ON DELETE CASCADE;
--   * даты и время хранятся как DATETIME без часового пояса (локальное время
--     сервера, «часы приложения»), время — как TIME;
--   * таблица alembic_version служебная: в ней Alembic хранит текущую ревизию.
-- ===========================================================================

PRAGMA foreign_keys = ON;

-- ---------------------------------------------------------------------------
-- Таблица: users — пользователи приложения
-- Назначение: хранение учётных записей, накопленного опыта и уровня.
-- Связи: 1:N с habits (привычки), 1:N с user_achievements (полученные ачивки).
-- Поля:
--   id            INTEGER  PRIMARY KEY AUTOINCREMENT — идентификатор
--   username      VARCHAR(50)  NOT NULL — отображаемое имя
--   email         VARCHAR(255) NOT NULL UNIQUE — e-mail (логин), уникален
--   password_hash VARCHAR(255) NOT NULL — хеш пароля bcrypt (открытый пароль не хранится)
--   xp            INTEGER  NOT NULL DEFAULT 0 — накопленный опыт
--   level         INTEGER  NOT NULL DEFAULT 1 — текущий уровень
--   avatar_url    VARCHAR(500) NULL — путь к загруженному аватару (/uploads/<uuid>.<ext>)
--   created_at    DATETIME NOT NULL — дата и время регистрации
-- ---------------------------------------------------------------------------
CREATE TABLE users (
	id INTEGER NOT NULL, 
	username VARCHAR(50) NOT NULL, 
	email VARCHAR(255) NOT NULL, 
	password_hash VARCHAR(255) NOT NULL, 
	xp INTEGER DEFAULT '0' NOT NULL, 
	level INTEGER DEFAULT '1' NOT NULL, 
	avatar_url VARCHAR(500), 
	created_at DATETIME NOT NULL, 
	PRIMARY KEY (id)
);

-- Индексы таблицы users
CREATE UNIQUE INDEX ix_users_email ON users (email);

-- ---------------------------------------------------------------------------
-- Таблица: categories — справочник категорий привычек
-- Назначение: тематическая группировка привычек (Здоровье, Спорт, ...).
-- Связи: 1:N с habits.
-- Поля:
--   id    INTEGER PRIMARY KEY AUTOINCREMENT — идентификатор
--   name  VARCHAR(50) NOT NULL — название категории на русском языке
--   slug  VARCHAR(50) NOT NULL UNIQUE — латинский идентификатор (health, sport, ...)
--   color VARCHAR(9)  NOT NULL — цвет из палитры docs/DESIGN-SYSTEM.md, формат #RRGGBB
--   icon  VARCHAR(50) NOT NULL — имя иконки интерфейса (heart-pulse, book, ...)
-- ---------------------------------------------------------------------------
CREATE TABLE categories (
	id INTEGER NOT NULL, 
	name VARCHAR(50) NOT NULL, 
	slug VARCHAR(50) NOT NULL, 
	color VARCHAR(9) NOT NULL, 
	icon VARCHAR(50) NOT NULL, 
	PRIMARY KEY (id)
);

-- Индексы таблицы categories
CREATE UNIQUE INDEX ix_categories_slug ON categories (slug);

-- ---------------------------------------------------------------------------
-- Таблица: achievements — справочник достижений (ачивок)
-- Назначение: описание условий получения достижений и награды за них.
-- Связи: 1:N с user_achievements.
-- Поля:
--   id             INTEGER PRIMARY KEY AUTOINCREMENT — идентификатор
--   code           VARCHAR(50)  NOT NULL UNIQUE — машинный код (first_habit, streak_7, ...)
--   name           VARCHAR(100) NOT NULL — название достижения
--   description    TEXT         NOT NULL — описание условия
--   icon           VARCHAR(50)  NOT NULL — имя иконки интерфейса
--   xp_reward      INTEGER      NOT NULL — награда в XP за получение
--   target         INTEGER      NOT NULL — целевое значение условия
--   condition_type VARCHAR(50)  NOT NULL — тип условия (total_completions, best_streak,
--                                          total_habits, level, completions_in_day,
--                                          early_completion, categories_covered)
-- ---------------------------------------------------------------------------
CREATE TABLE achievements (
	id INTEGER NOT NULL, 
	code VARCHAR(50) NOT NULL, 
	name VARCHAR(100) NOT NULL, 
	description TEXT NOT NULL, 
	icon VARCHAR(50) NOT NULL, 
	xp_reward INTEGER NOT NULL, 
	target INTEGER NOT NULL, 
	condition_type VARCHAR(50) NOT NULL, 
	PRIMARY KEY (id)
);

-- Индексы таблицы achievements
CREATE UNIQUE INDEX ix_achievements_code ON achievements (code);

-- ---------------------------------------------------------------------------
-- Таблица: habits — привычки пользователей
-- Назначение: описание отслеживаемой привычки и её параметров.
-- Связи: N:1 с users (ON DELETE CASCADE), N:1 с categories (ON DELETE CASCADE),
--        1:N с habit_completions (ON DELETE CASCADE).
-- Поля:
--   id            INTEGER PRIMARY KEY AUTOINCREMENT — идентификатор
--   user_id       INTEGER NOT NULL — владелец привычки (FK -> users.id)
--   name          VARCHAR(100) NOT NULL — название привычки
--   description   TEXT NULL — подробное описание
--   category_id   INTEGER NOT NULL — категория (FK -> categories.id)
--   difficulty    VARCHAR(10) NOT NULL — сложность: easy | medium | hard
--   frequency     VARCHAR(10) NOT NULL — частота: daily | weekly | monthly
--   reminder_time TIME NULL — время напоминания (ЧЧ:ММ)
--   is_active     BOOLEAN NOT NULL DEFAULT 1 — активна ли привычка
--   created_at    DATETIME NOT NULL — дата и время создания
-- Ограничения: ck_habits_difficulty, ck_habits_frequency (проверка допустимых значений).
-- ---------------------------------------------------------------------------
CREATE TABLE habits (
	id INTEGER NOT NULL, 
	user_id INTEGER NOT NULL, 
	name VARCHAR(100) NOT NULL, 
	description TEXT, 
	category_id INTEGER NOT NULL, 
	difficulty VARCHAR(10) NOT NULL, 
	frequency VARCHAR(10) NOT NULL, 
	reminder_time TIME, 
	is_active BOOLEAN DEFAULT '1' NOT NULL, 
	created_at DATETIME NOT NULL, 
	PRIMARY KEY (id), 
	CONSTRAINT ck_habits_difficulty CHECK (difficulty IN ('easy', 'medium', 'hard')), 
	CONSTRAINT ck_habits_frequency CHECK (frequency IN ('daily', 'weekly', 'monthly')), 
	FOREIGN KEY(category_id) REFERENCES categories (id) ON DELETE CASCADE, 
	FOREIGN KEY(user_id) REFERENCES users (id) ON DELETE CASCADE
);

-- Индексы таблицы habits
CREATE INDEX ix_habits_category_id ON habits (category_id);
CREATE INDEX ix_habits_user_id ON habits (user_id);

-- ---------------------------------------------------------------------------
-- Таблица: habit_completions — история выполнения привычек
-- Назначение: факт выполнения привычки в конкретную дату и начисленный XP.
-- Связи: N:1 с habits (ON DELETE CASCADE).
-- Поля:
--   id              INTEGER PRIMARY KEY AUTOINCREMENT — идентификатор
--   habit_id        INTEGER NOT NULL — привычка (FK -> habits.id)
--   completed_at    DATETIME NOT NULL — дата и время отметки
--   completion_date DATE NOT NULL — календарная дата отметки (без времени),
--                                   служит для расчёта серий и уникальности
--   xp_earned       INTEGER NOT NULL — начислено XP (базовый + бонус за серию)
-- Ограничения: uq_habit_completions_habit_date (habit_id, completion_date) —
--              повторная отметка одной привычки за одну дату невозможна.
-- ---------------------------------------------------------------------------
CREATE TABLE habit_completions (
	id INTEGER NOT NULL, 
	habit_id INTEGER NOT NULL, 
	completed_at DATETIME NOT NULL, 
	completion_date DATE NOT NULL, 
	xp_earned INTEGER NOT NULL, 
	PRIMARY KEY (id), 
	FOREIGN KEY(habit_id) REFERENCES habits (id) ON DELETE CASCADE, 
	CONSTRAINT uq_habit_completions_habit_date UNIQUE (habit_id, completion_date)
);

-- Индексы таблицы habit_completions
CREATE INDEX ix_habit_completions_completion_date ON habit_completions (completion_date);
CREATE INDEX ix_habit_completions_habit_id ON habit_completions (habit_id);

-- ---------------------------------------------------------------------------
-- Таблица: user_achievements — полученные пользователями достижения
-- Назначение: связь «многие ко многим» между пользователями и достижениями.
-- Связи: N:1 с users (ON DELETE CASCADE), N:1 с achievements (ON DELETE CASCADE).
-- Поля:
--   id             INTEGER PRIMARY KEY AUTOINCREMENT — идентификатор
--   user_id        INTEGER NOT NULL — пользователь (FK -> users.id)
--   achievement_id INTEGER NOT NULL — достижение (FK -> achievements.id)
--   unlocked_at    DATETIME NOT NULL — дата и время получения достижения
-- Ограничения: uq_user_achievements_user_achievement (user_id, achievement_id).
-- ---------------------------------------------------------------------------
CREATE TABLE user_achievements (
	id INTEGER NOT NULL, 
	user_id INTEGER NOT NULL, 
	achievement_id INTEGER NOT NULL, 
	unlocked_at DATETIME NOT NULL, 
	PRIMARY KEY (id), 
	FOREIGN KEY(achievement_id) REFERENCES achievements (id) ON DELETE CASCADE, 
	FOREIGN KEY(user_id) REFERENCES users (id) ON DELETE CASCADE, 
	CONSTRAINT uq_user_achievements_user_achievement UNIQUE (user_id, achievement_id)
);

-- Индексы таблицы user_achievements
CREATE INDEX ix_user_achievements_achievement_id ON user_achievements (achievement_id);
CREATE INDEX ix_user_achievements_user_id ON user_achievements (user_id);

-- ---------------------------------------------------------------------------
-- Служебная таблица Alembic: хранит идентификатор применённой ревизии.
-- ---------------------------------------------------------------------------
CREATE TABLE alembic_version (
    version_num VARCHAR(32) NOT NULL,
    CONSTRAINT alembic_version_pkc PRIMARY KEY (version_num)
);
