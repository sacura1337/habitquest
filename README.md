<div align="center">

# HabitQuest

**Трекер привычек с геймификацией**

Адаптивное веб-приложение: пользователь создаёт полезные привычки, отмечает выполнение,
получает опыт (XP), повышает уровень, собирает серии и открывает достижения.

Учебная практика УП.08 «Разработка дизайна веб-приложений»
МДК.08.02 Графический дизайн и мультимедиа · ПК 8.2, ПК 8.3

</div>

---

## Ссылки проекта

| Что | Ссылка |
| --- | --- |
| **Работающий сайт (интерфейс и API)** | **https://habitquest-api-sacura1337.msk1.amvera.tech/** |
| Резервная версия интерфейса | [sacura1337.github.io/habitquest](https://sacura1337.github.io/habitquest/) |
| Документация API (Swagger) | [habitquest-api-sacura1337.msk1.amvera.tech/docs](https://habitquest-api-sacura1337.msk1.amvera.tech/docs) |
| Макет и прототип в Figma | [HabitQuest — Задание 2 UI/UX](https://www.figma.com/design/U2nB966Xfexjc2zSSvmwAC/HabitQuest-%E2%80%94-%D0%97%D0%B0%D0%B4%D0%B0%D0%BD%D0%B8%D0%B5-2-UI-UX?node-id=0-1) |
| Техническое задание | [docs/ТЗ_HabitQuest.docx](docs/ТЗ_HabitQuest.docx) |
| Инструкция по публикации | [docs/DEPLOY.md](docs/DEPLOY.md) |
| Описание REST API | [docs/API.md](docs/API.md) |
| Презентация проекта | [docs/Презентация_HabitQuest.pptx](docs/Презентация_HabitQuest.pptx) |

## О проекте

Обычные списки задач быстро надоедают, и человек бросает привычку через несколько дней.
HabitQuest решает эту проблему игровыми механиками: за каждое выполнение начисляется опыт,
растёт уровень, сохраняется серия выполнения, открываются достижения, а прогресс виден
на графиках.

**Ключевые возможности**

- регистрация и вход, пароль хранится только в виде хеша (bcrypt), авторизация по JWT;
- создание, редактирование и удаление привычек: категория, сложность, частота, время напоминания;
- отметка выполнения в один клик и отмена отметки;
- геймификация: опыт, уровни, серии, бонусы, автоматическая выдача достижений;
- статистика: день / неделя / месяц, график выполнения, процент выполнения, разбивка по категориям;
- таблица привычек с сортировкой по столбцам, поиском, фильтрами и постраничной навигацией;
- каталог привычек на CSS Grid как современная замена табличной вёрстке;
- слайдер с автопрокруткой, стрелками, точками и свайпом, слайды загружаются из базы данных;
- анимации при прокрутке, скелетоны загрузки, уважение к настройке `prefers-reduced-motion`;
- светлая и тёмная тема с сохранением выбора;
- загрузка аватара через форму (multipart/form-data);
- адаптивная вёрстка mobile-first: 390 px, 768 px, 1440 px.

## Стек технологий

| Слой | Технология |
| --- | --- |
| Макет и дизайн | Figma, UI-kit, дизайн-токены (CSS-переменные) |
| Схемы | draw.io (карта сайта), dbdiagram.io (ER-диаграмма) |
| Фронтенд | React 18, JavaScript (JSX), Vite |
| Маршрутизация | React Router 6 (HashRouter — обоснование ниже) |
| Стили | CSS-переменные, Flexbox, CSS Grid, обычные CSS-файлы |
| Бэкенд | Python 3.12, FastAPI, Pydantic v2 |
| База данных | SQLAlchemy 2.0, Alembic, SQLite (разработка) / PostgreSQL (публикация) |
| Авторизация | JWT (PyJWT), bcrypt |
| Анимации | CSS-переходы и `@keyframes`, собственный слайдер, Intersection Observer |

Обоснование выбора стека — в техническом задании, раздел 7.

**Почему HashRouter.** Сайт опубликован на GitHub Pages, который отдаёт только статические
файлы и не умеет перенаправлять произвольные адреса на `index.html`. При обычном
`BrowserRouter` ссылка вида `/app/habits/3` сломалась бы при обновлении страницы.
С `HashRouter` прямой заход и обновление работают всегда.

## Структура репозитория

```text
.
├── frontend/                     клиентская часть (React + Vite)
│   ├── src/
│   │   ├── api/                  обращение к REST API: клиент и методы
│   │   ├── components/
│   │   │   ├── habits/           карточка, форма, слайдер привычек
│   │   │   ├── layout/           каркас: меню, шапка, подвал, крошки, защита маршрутов
│   │   │   ├── stats/            карточки показателей, уровень, график
│   │   │   └── ui/               кнопки, поля, таблица, пагинация, скелетоны
│   │   ├── context/              авторизация, тема, уведомления
│   │   ├── hooks/                загрузка данных, задержка поиска, появление при прокрутке
│   │   ├── pages/                страницы приложения
│   │   ├── styles/               токены, глобальные стили, стили компонентов
│   │   └── utils/                форматирование, проверка форм, справочники
│   └── docs/screenshots/         визуальные материалы задания 2
├── backend/                      серверная часть (FastAPI)
│   ├── app/api/                  маршруты REST API
│   ├── app/models/               модели SQLAlchemy (6 таблиц)
│   ├── app/schemas/              схемы Pydantic
│   ├── app/services/             бизнес-логика и геймификация
│   ├── app/core/                 конфигурация и безопасность
│   └── alembic/                  миграции базы данных
├── database/                     скрипты создания БД и тестовые данные
├── docs/                         техническое задание, описание API, инструкция по публикации
└── README.md
```

## Быстрый старт

### Требования

- Node.js 20 или новее
- Python 3.11 или новее
- Git

### 1. Клонирование

```bash
git clone https://github.com/sacura1337/habitquest.git
cd habitquest
```

### 2. Бэкенд

```bash
cd backend
python -m venv .venv
# Windows
.venv\Scripts\activate
# Linux / macOS
source .venv/bin/activate

pip install -r requirements.txt
copy .env.example .env      # Linux / macOS: cp .env.example .env
alembic upgrade head
python -m app.seed           # тестовые данные
uvicorn app.main:app --reload
```

API будет доступно на `http://127.0.0.1:8000`, документация — `http://127.0.0.1:8000/docs`.

### 3. Фронтенд

```bash
cd frontend
npm install
copy .env.example .env.local # Linux / macOS: cp .env.example .env.local
npm run dev
```

Приложение откроется на `http://127.0.0.1:5173`.

В файле `.env.local` укажите адрес бэкенда:

```text
VITE_API_URL=http://127.0.0.1:8000
```

Для сборки под публикацию тот же адрес передаётся переменной окружения `VITE_API_URL`
(см. `.github/workflows/deploy-frontend.yml`).

### Тестовый аккаунт

| Логин | Пароль |
| --- | --- |
| `demo@habitquest.ru` | `demo1234` |

## Что реализовано по заданиям практики

| Задание | Где смотреть в коде |
| --- | --- |
| 1. ТЗ, логическая и физическая структура | `docs/ТЗ_HabitQuest.docx`, `docs/sitemap.png`, `docs/er_diagram.png` |
| 2. Макет, UI-kit, прототип | Figma, `frontend/src/styles/tokens.css` |
| 3. CSS, стартовая страница | `frontend/src/pages/LandingPage.jsx`, `frontend/src/styles/components.css`, публикация через GitHub Actions |
| 4. Ссылки, меню, якоря | `frontend/src/App.jsx` (маршруты), `frontend/src/components/layout/` (меню, крошки, 404, «Наверх») |
| 5. Таблицы и база данных | `frontend/src/components/ui/DataTable.jsx`, `frontend/src/pages/HabitsPage.jsx`, `frontend/src/pages/StatisticsPage.jsx`, `backend/`, `database/` |
| 6. Формы | `frontend/src/pages/LoginPage.jsx`, `frontend/src/pages/RegisterPage.jsx`, `frontend/src/components/habits/HabitForm.jsx`, `frontend/src/pages/ProfilePage.jsx`, `frontend/src/utils/validation.js` |
| 7. Анимации и слайдер | `frontend/src/components/habits/HabitSlider.jsx`, `frontend/src/components/ui/Reveal.jsx`, `frontend/src/styles/components.css` |

## Скриншоты

Раздел заполняется после вёрстки и деплоя: главная страница, личный кабинет,
список привычек, статистика, достижения, мобильная версия.

В папке `frontend/docs/screenshots/` лежат визуальные материалы задания 2 —
дизайн-борд, макеты десктопа и телефона в светлой и тёмной теме.

## Команда проекта

| Участник | Зона ответственности |
| --- | --- |
| Илья Мальцев | UI/UX, Figma, статистика, геймификация, интеграция и тестирование |
| Михаил Лютоев | Backend, API, база данных, авторизация |
| Андрей Тимофеев | Frontend, компоненты, страницы, адаптивность |

## Право

Проект выполнен в учебных целях. Шлакоблоки team
