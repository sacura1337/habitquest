/**
 * Кнопка приложения.
 *
 * Внешний вид задаётся вариантом: основное действие, второстепенное,
 * опасное (удаление) и невидимая кнопка-ссылка. Состояние загрузки
 * блокирует повторное нажатие — это защищает формы от двойной отправки.
 */

import { Loader2 } from 'lucide-react'

const VARIANTS = {
  primary: 'primary-button',
  secondary: 'secondary-button',
  danger: 'danger-button',
  ghost: 'ghost-button',
  link: 'link-button',
}

export default function Button({
  variant = 'primary',
  size,
  loading = false,
  icon: Icon,
  children,
  className = '',
  disabled,
  type = 'button',
  ...rest
}) {
  const classes = [VARIANTS[variant] ?? VARIANTS.primary, size === 'sm' && 'button-sm', className]
    .filter(Boolean)
    .join(' ')

  return (
    <button type={type} className={classes} disabled={disabled || loading} {...rest}>
      {loading ? <Loader2 size={16} className="spin" aria-hidden="true" /> : Icon ? <Icon size={16} /> : null}
      {children}
    </button>
  )
}
