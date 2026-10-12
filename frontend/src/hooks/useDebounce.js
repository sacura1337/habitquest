/**
 * Задержка значения — нужна для поиска по таблице.
 *
 * Пользователь печатает название привычки, а запрос к серверу уходит
 * не на каждую букву, а после короткой паузы.
 */

import { useEffect, useState } from 'react'

export function useDebounce(value, delay = 400) {
  const [debounced, setDebounced] = useState(value)

  useEffect(() => {
    const timer = setTimeout(() => setDebounced(value), delay)
    return () => clearTimeout(timer)
  }, [value, delay])

  return debounced
}

export default useDebounce
