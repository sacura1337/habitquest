/**
 * Появление блока при прокрутке.
 *
 * Использует Intersection Observer — тот же механизм, что и в «звёздочке»
 * задания 4 для подсветки активного раздела. Как только элемент попал
 * в область видимости, возвращается признак `inView` и анимация запускается
 * один раз (`once`), чтобы блок не мигал при обратной прокрутке.
 */

import { useEffect, useRef, useState } from 'react'

export function useInView(options = {}) {
  const { threshold = 0.15, rootMargin = '0px 0px -60px 0px', once = true } = options

  const ref = useRef(null)
  const [inView, setInView] = useState(false)

  useEffect(() => {
    const element = ref.current
    if (!element) return undefined

    // Если браузер не поддерживает Observer, показываем блок сразу.
    if (typeof IntersectionObserver === 'undefined') {
      setInView(true)
      return undefined
    }

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setInView(true)
            if (once) observer.unobserve(entry.target)
          } else if (!once) {
            setInView(false)
          }
        })
      },
      { threshold, rootMargin },
    )

    observer.observe(element)
    return () => observer.disconnect()
  }, [threshold, rootMargin, once])

  return [ref, inView]
}

export default useInView
