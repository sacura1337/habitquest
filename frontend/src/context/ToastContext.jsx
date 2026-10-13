/**
 * Всплывающие уведомления.
 *
 * Используются после сохранения привычки, отметки выполнения, загрузки
 * аватара и при ошибках, о которых нужно сообщить без перехода на другую
 * страницу. Сообщение исчезает само через несколько секунд.
 */

import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react'
import { AlertTriangle, Check, Info } from 'lucide-react'

const ToastContext = createContext(null)

let nextId = 1

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([])
  const timers = useRef(new Map())

  // Снимаем все таймеры при размонтировании провайдера.
  useEffect(() => {
    const map = timers.current
    return () => {
      map.forEach((timer) => clearTimeout(timer))
      map.clear()
    }
  }, [])

  const dismiss = useCallback((id) => {
    setToasts((list) => list.filter((toast) => toast.id !== id))
    const timer = timers.current.get(id)
    if (timer) {
      clearTimeout(timer)
      timers.current.delete(id)
    }
  }, [])

  /**
   * Показать сообщение.
   *
   * @param {string} message текст
   * @param {'success'|'error'|'info'} tone оформление
   */
  const notify = useCallback(
    (message, tone = 'success') => {
      if (!message) return
      const id = nextId++
      setToasts((list) => [...list, { id, message, tone }])
      timers.current.set(
        id,
        setTimeout(() => dismiss(id), tone === 'error' ? 6000 : 3500),
      )
    },
    [dismiss],
  )

  const value = useMemo(() => ({ notify, dismiss }), [notify, dismiss])

  return (
    <ToastContext.Provider value={value}>
      {children}
      <div className="toast-stack" role="status" aria-live="polite">
        {toasts.map((toast) => (
          <div key={toast.id} className={`toast toast-${toast.tone}`} onClick={() => dismiss(toast.id)}>
            {toast.tone === 'error' ? (
              <AlertTriangle size={17} />
            ) : toast.tone === 'info' ? (
              <Info size={17} />
            ) : (
              <Check size={17} />
            )}
            <span>{toast.message}</span>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  )
}

/** Доступ к показу уведомлений. */
export function useToast() {
  const context = useContext(ToastContext)
  if (!context) throw new Error('useToast должен вызываться внутри ToastProvider')
  return context
}

export default ToastContext
