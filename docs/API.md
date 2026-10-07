# HabitQuest — описание REST API

Базовый адрес: `/api` (локально `http://localhost:8000/api`).
Формат данных: JSON, кодировка UTF-8.
Авторизация: заголовок `Authorization: Bearer <access_token>` для всех закрытых методов.

Формат ошибок — стандартный для FastAPI:

```json
{ "detail": "Привычка не найдена" }
```

Ошибки валидации возвращают код `422` и список полей в `detail`.

Коды ответов: `200` — успех, `201` — создано, `204` — удалено без тела,
`400` — бизнес-ошибка, `401` — не авторизован, `403` — нет доступа к чужому объекту,
`404` — не найдено, `422` — ошибка валидации, `500` — ошибка сервера.

## 1. Аутентификация

| Метод | Адрес | Назначение | Доступ |
| --- | --- | --- | --- |
| POST | `/api/auth/register` | регистрация | публичный |
| POST | `/api/auth/login` | вход, выдача JWT | публичный |
| GET | `/api/auth/me` | текущий пользователь | по токену |

**POST /api/auth/register**

```json
{ "username": "Михаил", "email": "demo@habitquest.ru", "password": "demo1234" }
```

Ответ `201`:

```json
{
  "access_token": "eyJhbGciOi...",
  "token_type": "bearer",
  "user": { "id": 1, "username": "Михаил", "email": "demo@habitquest.ru",
            "xp": 0, "level": 1, "avatar_url": null, "created_at": "2026-01-15T10:00:00" }
}
```

Ошибки: `400` — e-mail уже зарегистрирован; `422` — пароль короче 8 символов, некорректный e-mail.

**POST /api/auth/login** — тело `{ "email": "...", "password": "..." }`, ответ как у регистрации.
Ошибка `401` — «Неверный e-mail или пароль».

## 2. Пользователь

| Метод | Адрес | Назначение |
| --- | --- | --- |
| PATCH | `/api/users/me` | изменить имя или аватар |
| POST | `/api/users/me/avatar` | загрузить аватар (multipart, поле `file`) |
| GET | `/api/users/me/stats` | сводная статистика профиля |

**GET /api/users/me/stats**

```json
{
  "total_habits": 6, "active_habits": 5, "total_completions": 84,
  "xp": 1240, "level": 5,
  "level_progress": { "current": 240, "target": 500, "percent": 48 },
  "best_streak": 21, "achievements_unlocked": 6
}
```

## 3. Категории

| Метод | Адрес | Назначение |
| --- | --- | --- |
| GET | `/api/categories` | список категорий привычек |

```json
[{ "id": 1, "name": "Здоровье", "slug": "health", "color": "#10B981", "icon": "heart-pulse" }]
```

## 4. Привычки

| Метод | Адрес | Назначение |
| --- | --- | --- |
| GET | `/api/habits` | список с поиском, фильтрами, сортировкой и пагинацией |
| POST | `/api/habits` | создать привычку |
| GET | `/api/habits/{id}` | одна привычка с подробной статистикой |
| PATCH | `/api/habits/{id}` | изменить привычку |
| DELETE | `/api/habits/{id}` | удалить привычку |
| POST | `/api/habits/{id}/complete` | отметить выполнение |
| DELETE | `/api/habits/{id}/complete?date=YYYY-MM-DD` | отменить отметку |
| GET | `/api/habits/{id}/completions` | история выполнения привычки |

**GET /api/habits** — параметры запроса:

| Параметр | Значения | По умолчанию |
| --- | --- | --- |
| `search` | строка поиска по названию и описанию | — |
| `category_id` | идентификатор категории | — |
| `difficulty` | `easy`, `medium`, `hard` | — |
| `is_active` | `true`, `false` | — |
| `sort` | `name`, `created_at`, `streak` | `created_at` |
| `order` | `asc`, `desc` | `desc` |
| `page` | номер страницы, с 1 | `1` |
| `limit` | размер страницы, 1–50 | `9` |

Ответ:

```json
{
  "items": [ { "id": 3, "name": "Читать 20 минут", "description": "Художественная литература",
               "category": { "id": 3, "name": "Саморазвитие", "slug": "growth", "color": "#6366F1", "icon": "book" },
               "difficulty": "easy", "frequency": "daily", "reminder_time": "21:00",
               "is_active": true, "created_at": "2026-01-16T09:00:00",
               "current_streak": 12, "max_streak": 18, "completed_today": true,
               "xp_per_completion": 10 } ],
  "total": 6, "page": 1, "limit": 9, "pages": 1
}
```

**POST /api/habits** — тело:

```json
{ "name": "Читать 20 минут", "description": "Художественная литература",
  "category_id": 3, "difficulty": "easy", "frequency": "daily",
  "reminder_time": "21:00", "is_active": true }
```

Ответ `201` — объект привычки. Ошибки: `422` — пустое название, неизвестная категория;
`400` — привычка с таким названием уже есть.

**GET /api/habits/{id}** — ответ дополняется полями:

```json
{
  "...": "все поля привычки",
  "total_completions": 48,
  "completion_percent": 73,
  "recent_completions": [ { "id": 91, "habit_id": 3, "completed_at": "2026-02-04T21:12:00", "xp_earned": 10 } ]
}
```

`403`, если привычка принадлежит другому пользователю.

**POST /api/habits/{id}/complete** — тело `{ "date": "2026-02-04" }` (необязательно, по умолчанию сегодня).
Ответ:

```json
{
  "completion": { "id": 92, "habit_id": 3, "completed_at": "2026-02-04T21:12:00", "xp_earned": 15 },
  "habit": { "...": "обновлённая привычка" },
  "xp_earned": 15, "bonus_xp": 5, "total_xp": 1255, "level": 5,
  "level_up": false, "current_streak": 13,
  "unlocked_achievements": [ { "id": 3, "name": "Неделя силы", "description": "Серия 7 дней",
                              "icon": "flame", "xp_reward": 50 } ]
}
```

Ошибка `400` — привычка уже отмечена за эту дату.

## 5. Статистика

| Метод | Адрес | Назначение |
| --- | --- | --- |
| GET | `/api/statistics/summary?period=day\|week\|month` | сводка за период |
| GET | `/api/statistics/progress?days=30` | точки графика выполнения |
| GET | `/api/statistics/history?limit=20&offset=0` | история выполнения всех привычек |

**GET /api/statistics/summary** — ответ:

```json
{
  "period": "week", "from": "2026-01-29", "to": "2026-02-04",
  "total_completions": 34, "possible_completions": 42, "completion_percent": 81,
  "xp_earned": 420, "active_habits": 6, "best_streak": 21,
  "by_category": [ { "category_id": 1, "name": "Здоровье", "color": "#10B981", "count": 12 } ]
}
```

**GET /api/statistics/progress** — ответ:

```json
[ { "date": "2026-01-06", "completed": 3, "total": 5, "percent": 60 } ]
```

**GET /api/statistics/history** — ответ:

```json
{ "items": [ { "id": 92, "habit_id": 3, "habit_name": "Читать 20 минут",
               "category_name": "Саморазвитие", "completed_at": "2026-02-04T21:12:00",
               "xp_earned": 15 } ],
  "total": 84 }
```

## 6. Достижения

| Метод | Адрес | Назначение |
| --- | --- | --- |
| GET | `/api/achievements` | все достижения со статусом получения |
| GET | `/api/achievements/unlocked` | только полученные |

```json
[ { "id": 3, "name": "Неделя силы", "description": "Выполнять привычку 7 дней подряд",
    "icon": "flame", "xp_reward": 50, "unlocked": true,
    "unlocked_at": "2026-01-28T07:40:00",
    "progress": { "current": 7, "target": 7, "percent": 100 } } ]
```

## 7. Статические файлы

Загруженные аватары отдаются по адресу `/uploads/<имя файла>`.

## 8. Правила геймификации

| Правило | Значение |
| --- | --- |
| XP за привычку | простая — 10, средняя — 20, сложная — 30 |
| Бонус за серию | +5 XP за каждые 7 дней непрерывной серии |
| Порог уровня | уровень `L` начинается с `100 × (L − 1) × L / 2` XP: 1 → 0, 2 → 100, 3 → 300, 4 → 600, 5 → 1000 |
| Серия (streak) | число последовательных дней (для недельных — недель), в которых привычка выполнена |
| Максимальная серия | наибольшая серия за всё время |

## 9. Достижения (стартовый набор)

| Код | Название | Условие | Награда |
| --- | --- | --- | --- |
| `first_habit` | Первый шаг | первое выполнение привычки | 20 XP |
| `streak_3` | Три дня подряд | серия 3 дня | 30 XP |
| `streak_7` | Неделя силы | серия 7 дней | 50 XP |
| `streak_30` | Месяц дисциплины | серия 30 дней | 200 XP |
| `completions_5` | Разогрев | 5 выполнений всего | 30 XP |
| `completions_50` | Полсотни | 50 выполнений всего | 100 XP |
| `completions_100` | Сотня | 100 выполнений всего | 200 XP |
| `habits_5` | Коллекционер | создать 5 привычек | 40 XP |
| `level_5` | Пятый уровень | достичь 5 уровня | 100 XP |
| `day_3` | Тройной удар | выполнить 3 привычки за день | 40 XP |
| `early_bird` | Ранняя птица | отметка выполнения до 08:00 | 30 XP |
| `all_categories` | Полный охват | иметь привычки во всех категориях | 60 XP |
