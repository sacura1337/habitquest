/**
 * Верхняя панель кабинета.
 *
 * Содержит поиск по привычкам (переносит на страницу привычек с параметром
 * адреса), переключатель темы, переход в профиль и кнопку выхода.
 */

import { useEffect, useRef, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Bell, LogOut, Menu, Moon, Search, Sun, UserRound } from 'lucide-react'
import { useAuth } from '../../context/AuthContext.jsx'
import { useTheme } from '../../context/ThemeContext.jsx'
import { resolveAssetUrl } from '../../api/client.js'
import { initialOf } from '../../utils/format.js'

export default function Header({ onOpenMenu }) {
  const { user, logout } = useAuth()
  const { theme, toggleTheme } = useTheme()
  const navigate = useNavigate()

  const [search, setSearch] = useState('')
  const [menuOpen, setMenuOpen] = useState(false)
  const menuRef = useRef(null)

  // Закрываем меню пользователя по клику вне его.
  useEffect(() => {
    if (!menuOpen) return undefined

    function handleClick(event) {
      if (!menuRef.current?.contains(event.target)) setMenuOpen(false)
    }

    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [menuOpen])

  /** Поиск переносится на страницу привычек — там он попадает в фильтры. */
  function submitSearch(event) {
    event.preventDefault()
    const query = search.trim()
    navigate(query ? `/app/habits?search=${encodeURIComponent(query)}` : '/app/habits')
  }

  const avatar = resolveAssetUrl(user?.avatar_url)

  return (
    <header className="topbar">
      <button className="icon-button mobile-menu" aria-label="Открыть меню" onClick={onOpenMenu}>
        <Menu size={20} />
      </button>

      <Link to="/app" className="mobile-brand">
        <span className="brand-mark">✦</span> HabitQuest
      </Link>

      <form className="search" role="search" onSubmit={submitSearch}>
        <Search size={17} />
        <input
          type="search"
          aria-label="Поиск привычек"
          placeholder="Поиск привычек..."
          value={search}
          onChange={(event) => setSearch(event.target.value)}
        />
        <kbd>Enter</kbd>
      </form>

      <div className="top-actions">
        <button
          type="button"
          className="icon-button"
          onClick={toggleTheme}
          aria-label={theme === 'light' ? 'Включить тёмную тему' : 'Включить светлую тему'}
        >
          {theme === 'light' ? <Moon size={18} /> : <Sun size={18} />}
        </button>

        <Link className="icon-button notification" aria-label="Достижения" to="/app/achievements">
          <Bell size={18} />
          <i />
        </Link>

        <div className="user-menu" ref={menuRef}>
          <button
            type="button"
            className="user"
            onClick={() => setMenuOpen((value) => !value)}
            aria-expanded={menuOpen}
            aria-haspopup="menu"
          >
            {avatar ? (
              <img className="avatar avatar-image" src={avatar} alt="" />
            ) : (
              <span className="avatar">{initialOf(user?.username)}</span>
            )}
            <div>
              <b>{user?.username ?? 'Гость'}</b>
              <small>Уровень {user?.level ?? 1}</small>
            </div>
          </button>

          {menuOpen ? (
            <div className="user-dropdown" role="menu">
              <Link to="/app/profile" role="menuitem" onClick={() => setMenuOpen(false)}>
                <UserRound size={15} /> Мой профиль
              </Link>
              <button
                type="button"
                role="menuitem"
                onClick={async () => {
                  setMenuOpen(false)
                  await logout()
                  navigate('/login')
                }}
              >
                <LogOut size={15} /> Выйти
              </button>
            </div>
          ) : null}
        </div>
      </div>
    </header>
  )
}
