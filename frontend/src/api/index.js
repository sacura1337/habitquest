/**
 * Методы REST API HabitQuest.
 *
 * Модуль повторяет структуру документа docs/API.md: аутентификация,
 * пользователь, категории, привычки, статистика, достижения.
 * Разделы приложения вызывают эти функции и не знают про fetch и токены.
 */

import { request } from './client.js'

/* ------------------------------------------------------------------ */
/* Аутентификация                                                      */
/* ------------------------------------------------------------------ */

export const auth = {
  /** POST /api/auth/register — регистрация, возвращает токен и пользователя. */
  register: (data) => request('/auth/register', { method: 'POST', body: data, auth: false }),

  /** POST /api/auth/login — вход по e-mail и паролю. */
  login: (data) => request('/auth/login', { method: 'POST', body: data, auth: false }),

  /** GET /api/auth/me — текущий пользователь по сохранённому токену. */
  me: () => request('/auth/me'),
}

// Отдельного метода выхода в API нет: сервер не хранит сессии, авторизация
// построена на JWT, который проверяется подписью. Выход выполняется удалением
// токена в браузере — см. AuthContext.

/* ------------------------------------------------------------------ */
/* Пользователь                                                        */
/* ------------------------------------------------------------------ */

export const users = {
  /** PATCH /api/users/me — изменить имя. */
  update: (data) => request('/users/me', { method: 'PATCH', body: data }),

  /** POST /api/users/me/avatar — загрузить аватар (multipart, поле file). */
  uploadAvatar: (file) => {
    const form = new FormData()
    form.append('file', file)
    return request('/users/me/avatar', { method: 'POST', body: form })
  },

  /** GET /api/users/me/stats — сводная статистика профиля. */
  stats: () => request('/users/me/stats'),
}

/* ------------------------------------------------------------------ */
/* Категории                                                           */
/* ------------------------------------------------------------------ */

export const categories = {
  /** GET /api/categories — список категорий для фильтров и форм. */
  list: () => request('/categories'),
}

/* ------------------------------------------------------------------ */
/* Привычки                                                            */
/* ------------------------------------------------------------------ */

export const habits = {
  /**
   * GET /api/habits — список с поиском, фильтрами, сортировкой и пагинацией.
   *
   * @param {object} params search, category_id, difficulty, is_active,
   *                        sort, order, page, limit
   */
  list: (params, signal) => request('/habits', { query: params, signal }),

  /** GET /api/habits/{id} — привычка с подробной статистикой. */
  get: (id, signal) => request(`/habits/${id}`, { signal }),

  /** POST /api/habits — создать привычку. */
  create: (data) => request('/habits', { method: 'POST', body: data }),

  /** PATCH /api/habits/{id} — изменить привычку. */
  update: (id, data) => request(`/habits/${id}`, { method: 'PATCH', body: data }),

  /** DELETE /api/habits/{id} — удалить привычку. */
  remove: (id) => request(`/habits/${id}`, { method: 'DELETE' }),

  /** POST /api/habits/{id}/complete — отметить выполнение за дату. */
  complete: (id, date) => request(`/habits/${id}/complete`, { method: 'POST', body: { date } }),

  /** DELETE /api/habits/{id}/complete?date= — отменить отметку. */
  uncomplete: (id, date) =>
    request(`/habits/${id}/complete`, { method: 'DELETE', query: { date } }),

  /** GET /api/habits/{id}/completions — история выполнения привычки. */
  completions: (id, params, signal) =>
    request(`/habits/${id}/completions`, { query: params, signal }),
}

/* ------------------------------------------------------------------ */
/* Статистика                                                          */
/* ------------------------------------------------------------------ */

export const statistics = {
  /** GET /api/statistics/summary?period=day|week|month — сводка за период. */
  summary: (period = 'week', signal) =>
    request('/statistics/summary', { query: { period }, signal }),

  /** GET /api/statistics/progress?days=30 — точки графика выполнения. */
  progress: (days = 30, signal) => request('/statistics/progress', { query: { days }, signal }),

  /** GET /api/statistics/history — история выполнения всех привычек. */
  history: (params, signal) => request('/statistics/history', { query: params, signal }),
}

/* ------------------------------------------------------------------ */
/* Достижения                                                          */
/* ------------------------------------------------------------------ */

export const achievements = {
  /** GET /api/achievements — все достижения со статусом получения. */
  list: (signal) => request('/achievements', { signal }),

  /** GET /api/achievements/unlocked — только полученные. */
  unlocked: (signal) => request('/achievements/unlocked', { signal }),
}

export default { auth, users, categories, habits, statistics, achievements }
