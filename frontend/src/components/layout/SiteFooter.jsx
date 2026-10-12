/**
 * Подвал сайта (задание 4).
 *
 * Содержит навигацию по разделам, контакты и ссылки на внешние ресурсы.
 * Внешние ссылки открываются в новой вкладке и получают rel="noopener",
 * чтобы чужая страница не могла управлять нашей вкладкой.
 */

import { Link } from 'react-router-dom'
import { Github, Mail, Send, Sparkles } from 'lucide-react'

const REPOSITORY_URL = 'https://github.com/sacura1337/habitquest'
const CONTACT_EMAIL = 'team@habitquest.ru'

const NAVIGATION = [
  { to: '/app', label: 'Кабинет' },
  { to: '/app/habits', label: 'Привычки' },
  { to: '/app/statistics', label: 'Статистика' },
  { to: '/app/achievements', label: 'Достижения' },
]

/** Внешняя ссылка: всегда в новой вкладке. */
function ExternalLink({ href, icon: Icon, children }) {
  return (
    <a href={href} target="_blank" rel="noopener noreferrer">
      <Icon size={15} />
      {children}
    </a>
  )
}

export default function SiteFooter() {
  return (
    <footer className="site-footer" id="contacts">
      <div className="site-footer-grid">
        <div className="site-footer-about">
          <span className="brand-mark">✦</span>
          <b>HabitQuest</b>
          <p>
            Трекер привычек с геймификацией. Учебный проект по учебной практике УП.08
            «Разработка дизайна веб-приложений».
          </p>
        </div>

        <nav className="site-footer-column" aria-label="Разделы приложения">
          <h3>Разделы</h3>
          {NAVIGATION.map((item) => (
            <Link key={item.to} to={item.to}>
              {item.label}
            </Link>
          ))}
        </nav>

        <div className="site-footer-column">
          <h3>Проект</h3>
          <ExternalLink href={REPOSITORY_URL} icon={Github}>
            Исходный код
          </ExternalLink>
          <ExternalLink href={`${REPOSITORY_URL}/blob/main/docs/API.md`} icon={Sparkles}>
            Описание API
          </ExternalLink>
          <ExternalLink href={`${REPOSITORY_URL}#readme`} icon={Sparkles}>
            Документация
          </ExternalLink>
        </div>

        <div className="site-footer-column">
          <h3>Контакты</h3>
          <a href={`mailto:${CONTACT_EMAIL}`}>
            <Mail size={15} />
            {CONTACT_EMAIL}
          </a>
          <ExternalLink href={REPOSITORY_URL} icon={Send}>
            Написать команде
          </ExternalLink>
        </div>
      </div>

      <div className="site-footer-bottom">
        <span>© {new Date().getFullYear()} HabitQuest · Шлакоблоки team</span>
        <span>Создавай привычки. Прокачивай себя. ✦</span>
      </div>
    </footer>
  )
}
