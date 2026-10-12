/**
 * Общий каркас страниц входа и регистрации.
 *
 * Слева — краткое описание проекта, справа — форма. На телефоне остаётся
 * только форма, чтобы не отвлекать пользователя от ввода данных.
 */

import { Link } from 'react-router-dom'
import { ArrowLeft, Sparkles } from 'lucide-react'

export default function AuthShell({ title, subtitle, children, footer }) {
  return (
    <main className="auth-page">
      <aside className="auth-aside">
        <Link to="/" className="auth-back">
          <ArrowLeft size={15} /> На главную
        </Link>

        <div className="auth-aside-body">
          <span className="brand-mark">✦</span>
          <h2>HabitQuest</h2>
          <p>
            Отмечайте привычки, получайте опыт, повышайте уровень и открывайте достижения.
            Прогресс сохраняется в базе данных и доступен с любого устройства.
          </p>

          <ul className="auth-benefits">
            <li>
              <Sparkles size={15} /> Опыт и уровни за каждое выполнение
            </li>
            <li>
              <Sparkles size={15} /> Серии выполнения и достижения
            </li>
            <li>
              <Sparkles size={15} /> Статистика за день, неделю и месяц
            </li>
          </ul>
        </div>

        <small className="auth-aside-footer">Учебная практика УП.08 · 2026</small>
      </aside>

      <section className="auth-form-area">
        <div className="auth-card">
          <header className="auth-card-head">
            <h1>{title}</h1>
            <p>{subtitle}</p>
          </header>

          {children}

          {footer ? <footer className="auth-card-foot">{footer}</footer> : null}
        </div>
      </section>
    </main>
  )
}
