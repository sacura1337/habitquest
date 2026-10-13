/**
 * Кнопка «Наверх» (задание 4).
 *
 * Появляется, когда пользователь прокрутил страницу вниз, и плавно
 * возвращает к началу. При системной настройке prefers-reduced-motion
 * прокрутка происходит без анимации — это задаётся в CSS.
 */

import { useEffect, useState } from 'react'
import { ArrowUp } from 'lucide-react'

const SHOW_AFTER = 400

export default function BackToTop() {
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    function handleScroll() {
      setVisible(window.scrollY > SHOW_AFTER)
    }

    handleScroll()
    window.addEventListener('scroll', handleScroll, { passive: true })
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  if (!visible) return null

  return (
    <button
      type="button"
      className="back-to-top"
      aria-label="Вернуться наверх"
      onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
    >
      <ArrowUp size={18} />
    </button>
  )
}
