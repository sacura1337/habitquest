/**
 * Контекст авторизации.
 *
 * Хранит текущего пользователя и токен, восстанавливает сессию после
 * перезагрузки страницы и разлогинивает при ответе 401 от сервера.
 * Пароль нигде не сохраняется: в localStorage лежит только JWT.
 */

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'
import { auth as authApi } from '../api/index.js'
import { clearToken, getToken, onUnauthorized, saveToken } from '../api/client.js'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)

  // Пока идёт проверка сохранённого токена, приложение показывает заглушку,
  // иначе защищённые страницы успели бы перенаправить на вход.
  const [initializing, setInitializing] = useState(Boolean(getToken()))
  const [error, setError] = useState(null)

  // Восстановление сессии после перезагрузки страницы.
  useEffect(() => {
    if (!getToken()) {
      setInitializing(false)
      return undefined
    }

    let alive = true
    authApi
      .me()
      .then((current) => {
        if (alive) setUser(current)
      })
      .catch(() => {
        if (alive) {
          clearToken()
          setUser(null)
        }
      })
      .finally(() => {
        if (alive) setInitializing(false)
      })

    return () => {
      alive = false
    }
  }, [])

  // Токен перестал действовать — сбрасываем пользователя без перезагрузки.
  useEffect(() => onUnauthorized(() => setUser(null)), [])

  /** Вход по e-mail и паролю. */
  const login = useCallback(async (credentials) => {
    const result = await authApi.login(credentials)
    saveToken(result.access_token)
    setUser(result.user)
    return result.user
  }, [])

  /** Регистрация нового пользователя. */
  const register = useCallback(async (data) => {
    const result = await authApi.register(data)
    saveToken(result.access_token)
    setUser(result.user)
    return result.user
  }, [])

  /**
   * Выход из системы.
   *
   * Сервер не хранит сессии: авторизация построена на JWT, который
   * проверяется подписью, поэтому отзывать на сервере нечего. Выход —
   * это удаление токена из браузера.
   */
  const logout = useCallback(() => {
    clearToken()
    setUser(null)
  }, [])

  /** Обновить данные пользователя, например после смены имени или аватара. */
  const applyUser = useCallback((next) => setUser(next), [])

  const value = useMemo(
    () => ({
      user,
      initializing,
      error,
      setError,
      login,
      register,
      logout,
      applyUser,
      isAuthenticated: Boolean(user),
    }),
    [user, initializing, error, login, register, logout, applyUser],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

/** Доступ к контексту авторизации. */
export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) throw new Error('useAuth должен вызываться внутри AuthProvider')
  return context
}

export default AuthContext
