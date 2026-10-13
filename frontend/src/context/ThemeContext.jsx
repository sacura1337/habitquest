/**
 * Контекст темы оформления.
 *
 * «Звёздочка» задания 3: переключатель светлой и тёмной темы с сохранением
 * выбора. Тема выставляется атрибутом `data-theme` на корне документа,
 * а цвета меняются в styles/tokens.css.
 */

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'

const STORAGE_KEY = 'habitquest-theme'
const ThemeContext = createContext(null)

/** Определить начальную тему: сохранённый выбор или настройка системы. */
function readInitialTheme() {
  const saved = localStorage.getItem(STORAGE_KEY)
  if (saved === 'light' || saved === 'dark') return saved

  const prefersDark =
    typeof window !== 'undefined' &&
    window.matchMedia?.('(prefers-color-scheme: dark)').matches

  return prefersDark ? 'dark' : 'light'
}

export function ThemeProvider({ children }) {
  const [theme, setTheme] = useState(readInitialTheme)

  // Применяем тему к документу и запоминаем выбор в браузере.
  useEffect(() => {
    document.documentElement.dataset.theme = theme
    localStorage.setItem(STORAGE_KEY, theme)

    // Адресная строка браузера на телефоне окрашивается под тему.
    const meta = document.querySelector('meta[name="theme-color"]')
    if (meta) meta.setAttribute('content', theme === 'dark' ? '#11131d' : '#f7f8fc')
  }, [theme])

  const toggleTheme = useCallback(() => {
    setTheme((current) => (current === 'light' ? 'dark' : 'light'))
  }, [])

  const value = useMemo(() => ({ theme, setTheme, toggleTheme }), [theme, toggleTheme])

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>
}

/** Доступ к текущей теме. */
export function useTheme() {
  const context = useContext(ThemeContext)
  if (!context) throw new Error('useTheme должен вызываться внутри ThemeProvider')
  return context
}

export default ThemeContext
