/**
 * Модальное окно.
 *
 * Используется для создания и редактирования привычки и подтверждения
 * удаления. Закрывается по клавише Escape и по нажатию на затемнение,
 * блокирует прокрутку страницы и переводит фокус внутрь окна.
 */

import { useEffect, useRef } from 'react'
import { X } from 'lucide-react'

export default function Modal({ open, title, caption, onClose, children, size }) {
  const dialogRef = useRef(null)

  // Escape закрывает окно, а фон не прокручивается, пока окно открыто.
  useEffect(() => {
    if (!open) return undefined

    function handleKeyDown(event) {
      if (event.key === 'Escape') onClose?.()
    }

    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    document.addEventListener('keydown', handleKeyDown)

    // Переводим фокус на первое поле — удобно и для клавиатуры, и для скринридера.
    const focusTarget = dialogRef.current?.querySelector('input, select, textarea, button')
    focusTarget?.focus?.()

    return () => {
      document.body.style.overflow = previousOverflow
      document.removeEventListener('keydown', handleKeyDown)
    }
  }, [open, onClose])

  if (!open) return null

  return (
    <div
      className="modal-backdrop"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onClose?.()
      }}
    >
      <section
        ref={dialogRef}
        className={`modal ${size === 'wide' ? 'modal-wide' : ''}`}
        role="dialog"
        aria-modal="true"
        aria-label={title}
      >
        <div className="modal-head">
          <div>
            {caption ? <small>{caption}</small> : null}
            <h2>{title}</h2>
          </div>
          <button type="button" className="icon-button" aria-label="Закрыть окно" onClick={onClose}>
            <X size={18} />
          </button>
        </div>
        {children}
      </section>
    </div>
  )
}
