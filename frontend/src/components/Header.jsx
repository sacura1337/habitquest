import { Bell, Menu, Moon, Sun, Search } from 'lucide-react'

// Верхняя панель с поиском, уведомлениями и переключением темы.
export default function Header({ theme, onToggleTheme, onOpenMenu }) {
  return <header className="topbar">
    <button className="icon-button mobile-menu" aria-label="Открыть меню" onClick={onOpenMenu}><Menu size={20}/></button>
    <div className="mobile-brand"><span className="brand-mark">✦</span> HabitQuest</div>
    <label className="search"><Search size={17}/><input aria-label="Поиск" placeholder="Поиск привычек..."/><kbd>⌘ K</kbd></label>
    <div className="top-actions">
      <button className="icon-button" onClick={onToggleTheme} aria-label="Переключить тему">{theme === 'light' ? <Moon size={18}/> : <Sun size={18}/>}</button>
      <button className="icon-button notification" aria-label="Уведомления"><Bell size={18}/><i/></button>
      <div className="user"><span className="avatar">А</span><div><b>Александр</b><small>Уровень 5</small></div></div>
    </div>
  </header>
}