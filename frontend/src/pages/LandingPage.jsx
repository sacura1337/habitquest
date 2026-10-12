/**
 * Стартовая (публичная) страница приложения.
 *
 * Выполняет требования задания 3 (свёрстана по макету, адаптивна) и
 * задания 4: якорные ссылки #about, #services, #contacts с плавной
 * прокруткой, меню с активным пунктом и кнопка «Наверх».
 *
 * Страница доступна без входа, поэтому данные берутся не из базы,
 * а из описания проекта — это витрина приложения.
 */

import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import {
  Award,
  BarChart3,
  Check,
  Flame,
  LayoutDashboard,
  LineChart,
  Moon,
  Rocket,
  ShieldCheck,
  Sparkles,
  Target,
  Trophy,
  UserPlus,
} from 'lucide-react'
import SiteFooter from '../components/layout/SiteFooter.jsx'
import BackToTop from '../components/layout/BackToTop.jsx'
import Reveal from '../components/ui/Reveal.jsx'
import { useTheme } from '../context/ThemeContext.jsx'

/** Пункты меню с якорными ссылками на разделы страницы. */
const ANCHORS = [
  { id: 'about', label: 'О проекте' },
  { id: 'services', label: 'Возможности' },
  { id: 'workflow', label: 'Как это работает' },
]

/** Возможности приложения — раздел #services. */
const FEATURES = [
  {
    icon: Target,
    tone: 'purple',
    title: 'Привычки с параметрами',
    text: 'Категория, сложность, частота и время напоминания. Всё хранится в базе данных и доступно с любого устройства.',
  },
  {
    icon: Sparkles,
    tone: 'blue',
    title: 'Опыт и уровни',
    text: 'За простое выполнение — 10 XP, за среднее — 20, за сложное — 30. Порог уровня растёт вместе с прогрессом.',
  },
  {
    icon: Flame,
    tone: 'orange',
    title: 'Серии выполнения',
    text: 'Считаются последовательные дни. За каждые семь дней серии начисляется дополнительный опыт.',
  },
  {
    icon: Trophy,
    tone: 'green',
    title: 'Достижения',
    text: 'Двенадцать достижений открываются автоматически: за первую привычку, серии, количество выполнений и уровень.',
  },
  {
    icon: BarChart3,
    tone: 'blue',
    title: 'Статистика',
    text: 'Сводка за день, неделю и месяц, график выполнения и разбивка по категориям.',
  },
  {
    icon: ShieldCheck,
    tone: 'purple',
    title: 'Безопасность',
    text: 'Пароль хранится только в виде хеша bcrypt, доступ к данным — по JWT-токену. Чужие привычки недоступны.',
  },
]

/** Шаги работы с приложением — раздел #workflow. */
const STEPS = [
  { title: 'Создайте аккаунт', text: 'Регистрация занимает минуту, подтверждение почты не требуется.' },
  { title: 'Добавьте привычку', text: 'Выберите категорию, сложность и удобное время напоминания.' },
  { title: 'Отмечайте выполнение', text: 'Один клик — и опыт начислен, серия продлена, достижения проверены.' },
  { title: 'Следите за прогрессом', text: 'Графики и статистика показывают, что получается, а что стоит изменить.' },
]

/** Заголовок страницы с якорным меню. */
function LandingHeader() {
  const { theme, toggleTheme } = useTheme()
  const [scrolled, setScrolled] = useState(false)

  // Тень у шапки появляется после начала прокрутки.
  useEffect(() => {
    function handleScroll() {
      setScrolled(window.scrollY > 20)
    }

    handleScroll()
    window.addEventListener('scroll', handleScroll, { passive: true })
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  return (
    <header className={`landing-header ${scrolled ? 'landing-header-scrolled' : ''}`}>
      <div className="landing-header-inner">
        <Link to="/" className="landing-brand">
          <span className="brand-mark">✦</span>
          <span>
            Habit<span className="accent">Quest</span>
          </span>
        </Link>

        <nav className="landing-nav" aria-label="Разделы страницы">
          {ANCHORS.map((anchor) => (
            <a key={anchor.id} href={`#${anchor.id}`}>
              {anchor.label}
            </a>
          ))}
        </nav>

        <div className="landing-actions">
          <button
            type="button"
            className="icon-button"
            onClick={toggleTheme}
            aria-label={theme === 'light' ? 'Включить тёмную тему' : 'Включить светлую тему'}
          >
            {theme === 'light' ? <Moon size={18} /> : <Sparkles size={18} />}
          </button>
          <Link className="secondary-button" to="/login">
            Войти
          </Link>
          <Link className="primary-button" to="/register">
            <UserPlus size={16} /> Начать
          </Link>
        </div>
      </div>
    </header>
  )
}

/** Миниатюра интерфейса в первом экране, собранная из тех же стилей. */
function HeroPreview() {
  const habits = [
    { title: 'Читать 20 минут', meta: 'Саморазвитие · +10 XP', done: true, tone: 'purple' },
    { title: 'Выпить 8 стаканов воды', meta: 'Здоровье · +10 XP', done: false, tone: 'blue' },
    { title: 'Тренировка', meta: 'Спорт · +30 XP', done: false, tone: 'orange' },
  ]

  return (
    <div className="hero-preview" aria-hidden="true">
      <div className="hero-preview-top">
        <div>
          <small>ТВОЙ УРОВЕНЬ</small>
          <b>4 · Практик</b>
        </div>
        <span className="level-number">
          <small>LVL</small>4
        </span>
      </div>

      <div className="xp-track hero-xp">
        <span style={{ width: '62%' }} />
      </div>

      <div className="habit-list">
        {habits.map((habit) => (
          <div className={`habit-card ${habit.done ? 'done' : ''}`} key={habit.title}>
            <div className={`habit-icon ${habit.tone}`}>
              <Target size={18} />
            </div>
            <div className="habit-info">
              <b>{habit.title}</b>
              <small>{habit.meta}</small>
            </div>
            <span className={`check ${habit.done ? 'checked' : ''}`}>{habit.done ? <Check size={15} /> : null}</span>
          </div>
        ))}
      </div>
    </div>
  )
}

export default function LandingPage() {
  return (
    <>
      <LandingHeader />

      <main className="landing">
        {/* Первый экран */}
        <section className="hero">
          <div className="hero-text">
            <span className="hero-badge">
              <Rocket size={14} /> Учебный проект УП.08 · React + FastAPI + PostgreSQL
            </span>

            <h1>
              Трекер привычек,
              <br />
              который <span className="accent">играет</span> вместе с вами
            </h1>

            <p className="hero-lead">
              HabitQuest превращает ежедневные действия в игру: за каждое выполнение начисляется опыт,
              растёт уровень, сохраняется серия, а достижения открываются сами. Данные хранятся
              в базе данных, поэтому прогресс не потеряется.
            </p>

            <div className="hero-actions">
              <Link className="primary-button" to="/register">
                <UserPlus size={16} /> Создать аккаунт
              </Link>
              <Link className="secondary-button" to="/login">
                <LayoutDashboard size={16} /> Войти в кабинет
              </Link>
            </div>

            <dl className="hero-stats">
              <div>
                <dt>6</dt>
                <dd>связанных таблиц в базе</dd>
              </div>
              <div>
                <dt>12</dt>
                <dd>достижений для открытия</dd>
              </div>
              <div>
                <dt>3</dt>
                <dd>контрольные точки адаптива</dd>
              </div>
            </dl>
          </div>

          <HeroPreview />
        </section>

        {/* О проекте */}
        <section className="landing-section" id="about">
          <Reveal className="section-intro">
            <span className="section-kicker">О ПРОЕКТЕ</span>
            <h2>Почему обычные списки задач не работают</h2>
            <p>
              Человек бросает новую привычку в среднем через несколько дней: отмечать галочки скучно,
              а результата сразу не видно. HabitQuest добавляет то, чего не хватает обычному списку, —
              понятную награду за каждое действие и наглядный прогресс.
            </p>
          </Reveal>

          <div className="landing-columns">
            <Reveal className="landing-card" delay={80}>
              <h3>Для кого</h3>
              <p>
                Для студентов и молодых специалистов, которые хотят наладить режим, учёбу и спорт,
                но им нужна внешняя мотивация и понятная статистика.
              </p>
              <ul className="landing-list">
                <li>Новичок: важно не бросить на первой неделе</li>
                <li>Опытный: интересны серии, уровни и рекорды</li>
              </ul>
            </Reveal>

            <Reveal className="landing-card" delay={160}>
              <h3>Что под капотом</h3>
              <p>
                Интерфейс собран на React, данные приходят с сервера на FastAPI, а хранятся
                в реляционной базе. Приложение открывается по публичной ссылке с телефона
                и с компьютера.
              </p>
              <ul className="landing-list">
                <li>React 18, Vite, React Router</li>
                <li>FastAPI, SQLAlchemy, Alembic</li>
                <li>JWT-авторизация и хеширование пароля</li>
              </ul>
            </Reveal>
          </div>
        </section>

        {/* Возможности */}
        <section className="landing-section" id="services">
          <Reveal className="section-intro">
            <span className="section-kicker">ВОЗМОЖНОСТИ</span>
            <h2>Что умеет приложение</h2>
            <p>Все разделы работают с реальными данными из базы, а не с заранее вписанными примерами.</p>
          </Reveal>

          <div className="feature-grid">
            {FEATURES.map((feature, index) => (
              <Reveal className="feature-card" key={feature.title} delay={index * 60}>
                <span className={`stat-icon ${feature.tone}`}>
                  <feature.icon size={20} />
                </span>
                <h3>{feature.title}</h3>
                <p>{feature.text}</p>
              </Reveal>
            ))}
          </div>
        </section>

        {/* Как это работает */}
        <section className="landing-section" id="workflow">
          <Reveal className="section-intro">
            <span className="section-kicker">КАК ЭТО РАБОТАЕТ</span>
            <h2>Четыре шага до первой серии</h2>
          </Reveal>

          <ol className="steps">
            {STEPS.map((step, index) => (
              <Reveal as="li" className="step" key={step.title} delay={index * 70}>
                <span className="step-number">{index + 1}</span>
                <h3>{step.title}</h3>
                <p>{step.text}</p>
              </Reveal>
            ))}
          </ol>
        </section>

        {/* Призыв к действию */}
        <Reveal className="cta-band">
          <div>
            <h2>Готовы начать первую серию?</h2>
            <p>Создайте аккаунт, добавьте привычку и отметьте первое выполнение уже сегодня.</p>
          </div>
          <div className="cta-actions">
            <Link className="primary-button" to="/register">
              <Award size={16} /> Создать аккаунт
            </Link>
            <Link className="secondary-button" to="/login">
              <LineChart size={16} /> Посмотреть демо-аккаунт
            </Link>
          </div>
        </Reveal>
      </main>

      <SiteFooter />
      <BackToTop />
    </>
  )
}
