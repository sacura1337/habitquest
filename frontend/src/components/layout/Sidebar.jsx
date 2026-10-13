/**
 * Боковая навигация кабинета.
 *
 * Пункты меню — это ссылки маршрутизатора, поэтому активный раздел
 * подсвечивается автоматически (в том числе при открытии прямой ссылки),
 * а работают кнопки «назад» и «вперёд» браузера.
 * На телефоне панель выезжает поверх содержимого.
 */

import { NavLink, Link } from 'react-router-dom'
import {
  Award,
  BarChart3,
  CircleHelp,
  Home,
  Settings,
  Sparkles,
  Target,
  Trophy,
  UserRound,
  X,
} from 'lucide-react'
import { levelProgress, levelTitle } from '../../utils/constants.js'
import { pluralizeWithCount } from '../../utils/format.js'

const MAIN_LINKS = [
  { to: '/app', label: 'Главная', icon: Home, end: true },
  { to: '/app/habits', label: 'Привычки', icon: Target, countKey: 'active_habits' },
  { to: '/app/statistics', label: 'Статистика', icon: BarChart3 },
  { to: '/app/achievements', label: 'Достижения', icon: Trophy, countKey: 'achievements_unlocked' },
]

const PERSONAL_LINKS = [
  { to: '/app/profile', label: 'Мой профиль', icon: UserRound },
  { to: '/app/settings', label: 'Настройки', icon: Settings },
]

function linkClass({ isActive }) {
  return `nav-link ${isActive ? 'active' : ''}`
}

export default function Sidebar({ open, onClose, stats }) {
  const progress = stats ? levelProgress(stats.xp ?? 0) : null

  return (
    <>
      {open ? <button className="scrim" aria-label="Закрыть меню" onClick={onClose} /> : null}

      <aside className={`sidebar ${open ? 'sidebar-open' : ''}`} aria-label="Основная навигация">
        <div className="brand">
          <Link to="/app" className="brand-link" onClick={onClose}>
            <span className="brand-mark">✦</span>
            <span>
              Habit<span className="accent">Quest</span>
            </span>
          </Link>
          <button className="icon-button close-menu" aria-label="Закрыть меню" onClick={onClose}>
            <X size={18} />
          </button>
        </div>

        <p className="nav-caption">МЕНЮ</p>
        <nav>
          {MAIN_LINKS.map(({ to, label, icon: Icon, end, countKey }) => (
            <NavLink key={to} to={to} end={end} className={linkClass} onClick={onClose}>
              <Icon size={18} />
              {label}
              {countKey && stats?.[countKey] ? <span className="count">{stats[countKey]}</span> : null}
            </NavLink>
          ))}
        </nav>

        <hr />
        <p className="nav-caption">ЛИЧНОЕ</p>
        <nav>
          {PERSONAL_LINKS.map(({ to, label, icon: Icon }) => (
            <NavLink key={to} to={to} className={linkClass} onClick={onClose}>
              <Icon size={18} />
              {label}
            </NavLink>
          ))}
        </nav>

        <div className="side-bottom">
          <span className="leaf">
            <Sparkles size={17} />
          </span>
          <b>{progress ? `${levelTitle(progress.level)} · уровень ${progress.level}` : 'Каждый день — шаг вперёд'}</b>
          <p>
            {progress
              ? `До следующего уровня осталось ${progress.target - progress.current} XP.`
              : 'Выполняй привычки и получай опыт.'}
          </p>
          <div className="mini-track">
            <span style={{ width: `${progress?.percent ?? 0}%` }} />
          </div>
          <small>
            {stats?.best_streak
              ? `Лучшая серия — ${pluralizeWithCount(stats.best_streak, 'день', 'дня', 'дней')}`
              : 'Серия пока не начата'}
          </small>
          <a href="#support">
            <CircleHelp size={15} /> Помощь и поддержка
          </a>
        </div>

        <small className="version">
          HABITQUEST <span>v1.0</span>
        </small>
      </aside>
    </>
  )
}
