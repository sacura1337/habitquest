# Публикация проекта HabitQuest

Документ описывает, как выложить проект в интернет. Разделы соответствуют зонам
ответственности участников команды.

| Что публикуется | Кто отвечает | Куда |
| --- | --- | --- |
| Бэкенд (FastAPI) | Михаил Лютоев | Render |
| База данных (PostgreSQL) | Михаил Лютоев | Render PostgreSQL |
| Фронтенд (React + Vite) | Андрей Тимофеев | Vercel или GitHub Pages |
| Макет и прототип | Илья Мальцев | Figma |

Порядок важен: сначала поднимается база данных и бэкенд, потом фронтенд —
ему нужен адрес API, а бэкенду — адрес фронтенда для списка CORS.

---

## 1. Что подготовлено в репозитории

| Файл | Назначение |
| --- | --- |
| `render.yaml` | Автоматическая конфигурация: веб-сервис + база данных PostgreSQL |
| `backend/requirements.txt` | Зависимости, включая драйвер PostgreSQL `psycopg[binary]` |
| `backend/.env.example` | Шаблон переменных окружения |
| `backend/alembic/` | Миграции схемы |
| `backend/app/seed.py` | Тестовые данные, в том числе аккаунт для проверки |

Проверьте, что в репозиторий **не попали** секреты: файл `backend/.env` уже
исключён в `.gitignore`.

---

## 2. Вариант А. Автоматическое развёртывание по `render.yaml`

1. Зарегистрируйтесь на [render.com](https://render.com) через аккаунт GitHub.
2. В панели нажмите **New → Blueprint**.
3. Выберите репозиторий `habitquest`. Render прочитает `render.yaml`.
4. Когда появится запрос значения для `CORS_ORIGINS`, впишите адрес фронтенда
   (если он ещё не готов — укажите пока `http://localhost:5173`, потом измените).
5. Нажмите **Apply**. Render создаст базу данных `habitquest-db`
   и веб-сервис `habitquest-api`.

Ключ `SECRET_KEY` Render сгенерирует сам, база данных создастся автоматически,
а миграции и тестовые данные применятся при первом запуске сервиса.

## 3. Вариант Б. Ручная настройка на Render

Этот путь надёжнее: формат `render.yaml` у хостинга иногда меняется,
а ручные шаги всегда одинаковы.

### Шаг 1. База данных

1. **New → PostgreSQL**.
2. Имя: `habitquest-db`. План: **Free**.
3. После создания скопируйте **Internal Database URL** — он понадобится как
   значение `DATABASE_URL`. Строка выглядит так:

   ```text
   postgresql://habitquest:пароль@dpg-xxxxx-a/habitquest
   ```

### Шаг 2. Веб-сервис

1. **New → Web Service** → подключить репозиторий `habitquest`.
2. Заполните поля:

   | Поле | Значение |
   | --- | --- |
   | Name | `habitquest-api` |
   | Root Directory | `backend` |
   | Runtime | `Python 3` |
   | Build Command | `pip install -r requirements.txt` |
   | Start Command | `alembic upgrade head && python -m app.seed && uvicorn app.main:app --host 0.0.0.0 --port $PORT` |
   | Health Check Path | `/` |
   | Instance Type | `Free` |

3. В разделе **Environment** добавьте переменные из таблицы ниже.

### Переменные окружения

| Переменная | Значение | Обязательна |
| --- | --- | --- |
| `DATABASE_URL` | Internal Database URL из шага 1 | да |
| `SECRET_KEY` | длинная случайная строка, минимум 32 символа | да |
| `ALGORITHM` | `HS256` | да |
| `ACCESS_TOKEN_EXPIRE_MINUTES` | `10080` (7 суток) | да |
| `CORS_ORIGINS` | адреса фронтенда через запятую | да |
| `UPLOAD_DIR` | `uploads` | нет |
| `PYTHON_VERSION` | `3.12.10` | нет |

Случайный ключ удобно получить так:

```powershell
python -c "import secrets; print(secrets.token_urlsafe(48))"
```

**Никогда не вписывайте эти значения в файлы репозитория** — только в переменные
окружения хостинга.

### Шаг 3. Проверка

После сборки Render выдаст адрес вида `https://habitquest-api.onrender.com`.

```powershell
# 1. Сервис отвечает
curl.exe https://habitquest-api.onrender.com/

# 2. Документация API открывается
start https://habitquest-api.onrender.com/docs

# 3. Вход тестовым аккаунтом (замените адрес на свой)
curl.exe -X POST https://habitquest-api.onrender.com/api/auth/login ^
  -H "Content-Type: application/json" ^
  -d "{\"email\":\"demo@habitquest.ru\",\"password\":\"demo1234\"}"
```

Третий запрос должен вернуть `access_token`, `token_type` и объект `user`.

### Шаг 4. Связь с фронтендом

1. Скопируйте адрес сервиса и пропишите его в переменной `VITE_API_URL`
   на хостинге фронтенда.
2. Вернитесь в настройки бэкенда и добавьте адрес фронтенда в `CORS_ORIGINS`:

   ```text
   https://habitquest.vercel.app,http://localhost:5173
   ```

3. Перезапустите сервис: **Manual Deploy → Restart**.

---

## 4. Ограничения бесплатного тарифа Render

| Ограничение | Как проявляется | Что делать |
| --- | --- | --- |
| Сервис засыпает | После 15 минут простоя первый запрос идёт 30–60 секунд | На защите откройте сайт заранее, чтобы сервис проснулся |
| Файловая система сбрасывается | Загруженные аватары исчезают после перезапуска | Для учебного проекта это допустимо; постоянное хранилище — платное. Ограничение описано в отчёте |
| База данных бесплатного плана | Удаляется, если не удаётся долго | Не оставляйте проект без внимания перед защитой |

---

## 5. Альтернативные хостинги

| Хостинг | Особенности |
| --- | --- |
| **Amvera** (amvera.ru) | Российский, оплата в рублях, есть бесплатный стартовый баланс. Развёртывание из Git или Docker |
| **Railway** (railway.app) | Похож на Render, бесплатный пробный период |
| **Timeweb Cloud** | Российский, поддерживает Python-приложения и PostgreSQL |
| **Собственный VPS** | Полный контроль. Нужны nginx, systemd и настройка PostgreSQL вручную |

Для любого из них используется та же команда запуска:

```bash
uvicorn app.main:app --host 0.0.0.0 --port $PORT
```

Только не забудьте выполнить перед первым запуском:

```bash
alembic upgrade head
python -m app.seed
```

---

## 6. Локальный запуск (для проверки перед публикацией)

```powershell
cd C:\Users\Lytik\Desktop\УП.08\backend
.\.venv\Scripts\python.exe -m alembic upgrade head
.\.venv\Scripts\python.exe -m app.seed
.\.venv\Scripts\python.exe -m uvicorn app.main:app --reload --port 8000
```

Тестовый аккаунт: `demo@habitquest.ru` / `demo1234`.
