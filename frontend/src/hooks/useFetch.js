/**
 * Загрузка данных с сервера.
 *
 * Хук избавляет страницы от одинакового кода: он хранит три состояния
 * («загрузка», «данные», «ошибка»), отменяет устаревший запрос при уходе
 * со страницы и умеет перезагружать данные вручную.
 */

import { useCallback, useEffect, useRef, useState } from 'react'

/**
 * @param {(signal: AbortSignal) => Promise<any>} fetcher функция запроса
 * @param {Array} deps   зависимости: при их изменении данные загружаются заново
 * @param {object} options
 *        enabled — выключает загрузку (например, пока нет токена);
 *        initial — значение по умолчанию, пока данных нет.
 */
export function useFetch(fetcher, deps = [], options = {}) {
  const { enabled = true, initial = null } = options

  const [data, setData] = useState(initial)
  const [loading, setLoading] = useState(enabled)
  const [error, setError] = useState(null)
  const [reloadKey, setReloadKey] = useState(0)

  // Свежая ссылка на функцию запроса без попадания в зависимости эффекта.
  const fetcherRef = useRef(fetcher)
  fetcherRef.current = fetcher

  // Значение по умолчанию тоже держим в ref, чтобы оно не вызывало цикл.
  const initialRef = useRef(initial)

  useEffect(() => {
    if (!enabled) {
      setData(initialRef.current)
      setLoading(false)
      setError(null)
      return undefined
    }

    const controller = new AbortController()
    setLoading(true)
    setError(null)

    fetcherRef
      .current(controller.signal)
      .then((result) => {
        if (controller.signal.aborted) return
        setData(result)
        setLoading(false)
      })
      .catch((caught) => {
        if (caught.name === 'AbortError' || controller.signal.aborted) return
        setError(caught)
        setLoading(false)
      })

    return () => controller.abort()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [...deps, enabled, reloadKey])

  /** Повторить запрос — используется кнопкой «Повторить» при ошибке. */
  const reload = useCallback(() => setReloadKey((key) => key + 1), [])

  return { data, loading, error, reload, setData }
}

export default useFetch
