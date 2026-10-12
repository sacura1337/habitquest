/**
 * Базовый клиент REST API.
 *
 * В одном месте собрано всё, что касается сетевого слоя: адрес сервера,
 * заголовок авторизации, разбор ошибок FastAPI и понятные русские сообщения.
 * Остальные модули обращаются к серверу только через функцию `request`.
 */

// Адрес сервера задаётся переменной окружения при сборке (см. .env.example).
// Если переменная не задана, используется локальный бэкенд разработчика.
export const SERVER_URL = (import.meta.env.VITE_API_URL ?? 'http://127.0.0.1:8000').replace(/\/+$/, '')

//: Префикс всех методов API — по документации docs/API.md.
const API_PREFIX = '/api'

//: Ключ, под которым JWT хранится в localStorage.
const TOKEN_KEY = 'habitquest-token'

/** Прочитать сохранённый токен. */
export function getToken() {
  return localStorage.getItem(TOKEN_KEY)
}

/** Сохранить токен после входа или регистрации. */
export function saveToken(token) {
  localStorage.setItem(TOKEN_KEY, token)
}

/** Удалить токен при выходе или истечении сессии. */
export function clearToken() {
  localStorage.removeItem(TOKEN_KEY)
}

/**
 * Ошибка обращения к API.
 *
 * `status` равен нулю, если запрос вообще не дошёл до сервера
 * (нет сети, сервер выключен, запрос отменён).
 */
export class ApiError extends Error {
  constructor(message, status = 0, details = null) {
    super(message)
    this.name = 'ApiError'
    this.status = status
    this.details = details
  }
}

/**
 * Подписка на события «токен перестал действовать».
 *
 * Контекст авторизации подписывается на это событие, чтобы разлогинить
 * пользователя, когда сервер вернул 401.
 */
const unauthorizedListeners = new Set()

export function onUnauthorized(listener) {
  unauthorizedListeners.add(listener)
  return () => unauthorizedListeners.delete(listener)
}

/**
 * Собрать читаемое сообщение из ответа FastAPI.
 *
 * Сервер возвращает либо `{"detail": "текст"}`, либо список ошибок
 * валидации вида `[{"loc": ["body", "password"], "msg": "..."}]`.
 */
function readDetail(payload) {
  if (!payload || typeof payload !== 'object') return ''
  const detail = payload.detail ?? payload.message

  if (typeof detail === 'string') return detail

  if (Array.isArray(detail)) {
    return detail
      .map((item) => {
        const field = Array.isArray(item?.loc)
          ? item.loc.filter((part) => part !== 'body' && part !== 'query').join('.')
          : ''
        const message = item?.msg ?? 'Некорректное значение'
        return field ? `${field}: ${message}` : message
      })
      .join('; ')
  }

  return ''
}

/**
 * Выполнить запрос к API.
 *
 * @param {string} path    путь без префикса `/api`, например `/habits`
 * @param {object} options method, body, query, signal, auth
 */
export async function request(path, options = {}) {
  const { method = 'GET', body, query, signal, auth = true } = options

  const url = new URL(`${SERVER_URL}${API_PREFIX}${path}`)
  if (query) {
    for (const [key, value] of Object.entries(query)) {
      if (value !== undefined && value !== null && value !== '') {
        url.searchParams.set(key, String(value))
      }
    }
  }

  const headers = {}
  const isFormData = body instanceof FormData
  if (body !== undefined && !isFormData) headers['Content-Type'] = 'application/json'

  const token = getToken()
  if (auth && token) headers.Authorization = `Bearer ${token}`

  let response
  try {
    response = await fetch(url, {
      method,
      headers,
      signal,
      body: isFormData ? body : body !== undefined ? JSON.stringify(body) : undefined,
    })
  } catch (error) {
    // Отменённый запрос — не ошибка приложения, пробрасываем как есть.
    if (error.name === 'AbortError') throw error
    throw new ApiError('Сервер не отвечает. Проверьте подключение к интернету.', 0)
  }

  // 204 — успешное удаление без тела ответа.
  if (response.status === 204) return null

  const text = await response.text()
  let payload = null
  if (text) {
    try {
      payload = JSON.parse(text)
    } catch {
      payload = null
    }
  }

  if (!response.ok) {
    if (response.status === 401 && auth) {
      clearToken()
      unauthorizedListeners.forEach((listener) => listener())
    }
    const message = readDetail(payload) || `Ошибка сервера (${response.status})`
    throw new ApiError(message, response.status, payload)
  }

  return payload
}

/**
 * Полный адрес загруженного файла.
 *
 * Бэкенд отдаёт аватары относительным путём `/uploads/имя.png`,
 * а открывать их нужно по адресу сервера.
 */
export function resolveAssetUrl(path) {
  if (!path) return ''
  if (/^https?:\/\//i.test(path)) return path
  return `${SERVER_URL}${path.startsWith('/') ? path : `/${path}`}`
}
