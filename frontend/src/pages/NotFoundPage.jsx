/**
 * Страница 404 (задание 4).
 *
 * Показывается при переходе по несуществующему адресу. Предлагает вернуться
 * на главную страницу или в кабинет.
 */

import { Link } from 'react-router-dom'
import { Compass, Home, LayoutDashboard } from 'lucide-react'

export default function NotFoundPage() {
  return (
    <main className="not-found">
      <div className="not-found-card">
        <span className="not-found-code">404</span>
        <span className="not-found-icon">
          <Compass size={34} />
        </span>
        <h1>Страница не найдена</h1>
        <p>
          Такого адреса в HabitQuest нет. Возможно, ссылка устарела или в адресе опечатка.
        </p>

        <div className="not-found-actions">
          <Link className="primary-button" to="/">
            <Home size={16} /> На главную
          </Link>
          <Link className="secondary-button" to="/app">
            <LayoutDashboard size={16} /> В кабинет
          </Link>
        </div>
      </div>
    </main>
  )
}
