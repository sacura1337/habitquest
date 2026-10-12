/**
 * Хлебные крошки (задание 4).
 *
 * Путь строится по адресу страницы: «Главная / Привычки / Читать 20 минут».
 * Последний пункт — текущая страница, он не является ссылкой. Если странице
 * нужно показать не название раздела, а имя объекта, она вызывает
 * хук useBreadcrumb и подставляет свою подпись.
 */

import { createContext, useContext, useEffect, useMemo, useState } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { ChevronRight, Home } from 'lucide-react'

const BreadcrumbContext = createContext(null)

/** Подписи разделов приложения по сегментам адреса. */
const SECTION_LABELS = {
  app: 'Кабинет',
  habits: 'Привычки',
  statistics: 'Статистика',
  achievements: 'Достижения',
  profile: 'Профиль',
  settings: 'Настройки',
  login: 'Вход',
  register: 'Регистрация',
}

export function BreadcrumbProvider({ children }) {
  const [label, setLabel] = useState(null)
  const value = useMemo(() => ({ label, setLabel }), [label])
  return <BreadcrumbContext.Provider value={value}>{children}</BreadcrumbContext.Provider>
}

/**
 * Подставить своё название последнего пункта — например, имя привычки.
 * Пока страница открыта, крошки показывают его вместо номера из адреса.
 */
export function useBreadcrumb(label) {
  const context = useContext(BreadcrumbContext)

  useEffect(() => {
    if (!context) return undefined
    context.setLabel(label ?? null)
    return () => context.setLabel(null)
  }, [context, label])
}

/** Собрать пункты крошек по адресу. */
function buildCrumbs(pathname, dynamicLabel) {
  const segments = pathname.split('/').filter(Boolean)
  const crumbs = []
  let accumulated = ''

  segments.forEach((segment) => {
    accumulated += `/${segment}`
    const isNumeric = /^\d+$/.test(segment)

    crumbs.push({
      path: accumulated,
      // Числовой сегмент — это идентификатор объекта, а не раздел.
      title: isNumeric ? (dynamicLabel ?? 'Подробнее') : (SECTION_LABELS[segment] ?? segment),
    })
  })

  return crumbs
}

export default function Breadcrumbs() {
  const location = useLocation()
  const context = useContext(BreadcrumbContext)
  const crumbs = buildCrumbs(location.pathname, context?.label)

  // На главной странице кабинета крошки не нужны.
  if (crumbs.length === 0) return null

  return (
    <nav className="breadcrumbs" aria-label="Хлебные крошки">
      <Link to="/" className="breadcrumb-link">
        <Home size={13} />
        На сайт
      </Link>

      {crumbs.map((crumb, index) => {
        const isLast = index === crumbs.length - 1
        return (
          <span className="breadcrumb-item" key={crumb.path}>
            <ChevronRight size={13} aria-hidden="true" />
            {isLast ? (
              <span className="breadcrumb-current" aria-current="page">
                {crumb.title}
              </span>
            ) : (
              <Link className="breadcrumb-link" to={crumb.path}>
                {crumb.title}
              </Link>
            )}
          </span>
        )
      })}
    </nav>
  )
}
