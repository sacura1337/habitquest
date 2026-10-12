/**
 * Прокрутка к началу страницы при переходе между разделами.
 *
 * Без этого при клике по пункту меню сохранялась бы позиция прокрутки
 * предыдущей страницы, что выглядит как ошибка.
 */

import { useEffect } from 'react'
import { useLocation } from 'react-router-dom'

export default function ScrollToTop() {
  const { pathname } = useLocation()

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'auto' })
  }, [pathname])

  return null
}
