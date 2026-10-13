/**
 * Появление блока при прокрутке (задание 7).
 *
 * Обёртка над хуком useInView: пока блок не попал в область видимости,
 * он смещён и прозрачен, после — плавно появляется. При системной настройке
 * prefers-reduced-motion анимация отключается средствами CSS.
 */

import { useInView } from '../../hooks/useInView.js'

export default function Reveal({ children, delay = 0, as: Tag = 'div', className = '', ...rest }) {
  const [ref, inView] = useInView()

  return (
    <Tag
      ref={ref}
      className={`reveal ${inView ? 'reveal-visible' : ''} ${className}`.trim()}
      style={delay ? { transitionDelay: `${delay}ms` } : undefined}
      {...rest}
    >
      {children}
    </Tag>
  )
}
