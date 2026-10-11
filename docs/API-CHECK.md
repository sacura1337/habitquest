# Проверка опубликованного API

Документ фиксирует результаты проверки серверной части на боевом окружении.
Материал используется в отчёте по практике (задание 5, задание 6).

| Параметр | Значение |
| --- | --- |
| Дата проверки | 12.10.2026 |
| Адрес API | https://habitquest-api-sacura1337.msk1.amvera.tech |
| Документация | https://habitquest-api-sacura1337.msk1.amvera.tech/docs |
| Хостинг | Amvera Cloud, регион Москва |
| База данных | SQLite на постоянном хранилище `/data` |
| Тестовый аккаунт | `demo@habitquest.ru` / `demo1234` |

## Что проверялось

Проверка выполнялась запросами к опубликованному сервису — так же, как это
делается в Postman. Всего 13 проверок, все пройдены.

| № | Метод и адрес | Ожидание | Результат |
| --- | --- | --- | --- |
| 1 | `GET /` | 200, сведения о сервисе | ✅ `HabitQuest API 1.0.0` |
| 2 | `GET /openapi.json` | 200, схема OpenAPI | ✅ |
| 3 | `POST /api/auth/login` | 200, токен и данные пользователя | ✅ `Михаил`, XP 5265, уровень 10 |
| 4 | `POST /api/auth/login` с неверным паролем | 401 | ✅ |
| 5 | `GET /api/auth/me` | 200 по токену | ✅ |
| 6 | `GET /api/auth/me` без токена | 401 | ✅ |
| 7 | `GET /api/categories` | 200, 8 категорий | ✅ |
| 8 | `GET /api/habits?limit=3` | 200, постраничный список | ✅ 9 привычек, 3 страницы |
| 9 | `GET /api/statistics/summary?period=month` | 200, сводка за месяц | ✅ 181 из 236, 77 % |
| 10 | `GET /api/statistics/progress?days=30` | 200, 30 точек графика | ✅ |
| 11 | `GET /api/achievements` | 200, 12 достижений | ✅ 11 получено |
| 12 | `GET /api/users/me/stats` | 200, статистика профиля | ✅ 9 привычек, 269 выполнений |
| 13 | `GET /api/habits` без токена | 401 | ✅ |

## Содержимое базы данных

Данные созданы миграциями и скриптом наполнения при первом запуске сервиса:

| Таблица | Записей |
| --- | --- |
| `users` | 3 |
| `categories` | 8 |
| `habits` | 15 |
| `habit_completions` | 404 |
| `achievements` | 12 |
| `user_achievements` | 24 |

## Пример ответа

Запрос:

```http
POST /api/auth/login
Content-Type: application/json

{"email": "demo@habitquest.ru", "password": "demo1234"}
```

Ответ:

```json
{
  "access_token": "eyJhbGciOiJIUzI1NiIs...",
  "token_type": "bearer",
  "user": {
    "id": 1,
    "username": "Михаил",
    "email": "demo@habitquest.ru",
    "xp": 5265,
    "level": 10,
    "avatar_url": null,
    "created_at": "2026-08-12T09:00:00"
  }
}
```

## Что показать в отчёте

1. Страницу документации Swagger по адресу `/docs` — она перечисляет все методы API.
2. Ответ метода входа с выданным токеном.
3. Ответ списка привычек с данными из базы.
4. Этот документ как сводку результатов проверки.
