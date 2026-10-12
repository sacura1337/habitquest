/**
 * Форматирование дат, чисел и русских подписей.
 *
 * Вынесено отдельно, чтобы одинаково выводить даты и в таблицах,
 * и в карточках, и в графиках.
 */

const dateFormatter = new Intl.DateTimeFormat('ru-RU', { day: 'numeric', month: 'long' })
const fullDateFormatter = new Intl.DateTimeFormat('ru-RU', {
  day: 'numeric',
  month: 'long',
  year: 'numeric',
})
const dateTimeFormatter = new Intl.DateTimeFormat('ru-RU', {
  day: 'numeric',
  month: 'long',
  hour: '2-digit',
  minute: '2-digit',
})
const shortDateFormatter = new Intl.DateTimeFormat('ru-RU', { day: '2-digit', month: '2-digit' })
const weekdayFormatter = new Intl.DateTimeFormat('ru-RU', { weekday: 'long' })

/** «4 февраля» */
export function formatDate(value) {
  if (!value) return '—'
  return dateFormatter.format(new Date(value))
}

/** «4 февраля 2026 г.» */
export function formatFullDate(value) {
  if (!value) return '—'
  return fullDateFormatter.format(new Date(value))
}

/** «4 февраля, 21:12» */
export function formatDateTime(value) {
  if (!value) return '—'
  return dateTimeFormatter.format(new Date(value))
}

/** «04.02» — для подписей графика. */
export function formatShortDate(value) {
  if (!value) return ''
  return shortDateFormatter.format(new Date(value))
}

/** «вторник» */
export function formatWeekday(value) {
  if (!value) return ''
  return weekdayFormatter.format(new Date(value))
}

/** Дата в формате HTML-поля input[type=date]: YYYY-MM-DD. */
export function toInputDate(value = new Date()) {
  const date = new Date(value)
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${date.getFullYear()}-${month}-${day}`
}

/** «1 240» — разряды разделяются неразрывным пробелом. */
export function formatNumber(value) {
  return new Intl.NumberFormat('ru-RU').format(Number(value) || 0)
}

/**
 * Русское склонение после числа: pluralize(3, 'день', 'дня', 'дней') → «дня».
 */
export function pluralize(count, one, few, many) {
  const value = Math.abs(Number(count) || 0) % 100
  const last = value % 10
  if (value > 10 && value < 20) return many
  if (last > 1 && last < 5) return few
  if (last === 1) return one
  return many
}

/** «3 дня», «1 день», «5 дней». */
export function pluralizeWithCount(count, one, few, many) {
  return `${formatNumber(count)} ${pluralize(count, one, few, many)}`
}

/** Инициал для аватара-заглушки. */
export function initialOf(name) {
  const text = (name ?? '').trim()
  return text ? text[0].toUpperCase() : '?'
}
