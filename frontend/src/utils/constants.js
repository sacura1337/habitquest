/**
 * Справочные данные приложения: подписи, иконки и правила геймификации.
 *
 * Значения взяты из документов docs/API.md (раздел 8 «Правила геймификации»)
 * и backend/app/services/gamification.py, чтобы интерфейс и сервер считали
 * уровни одинаково.
 */

/* --- Сложность привычки ------------------------------------------------- */

export const DIFFICULTIES = [
  { value: 'easy', label: 'Простая', xp: 10 },
  { value: 'medium', label: 'Средняя', xp: 20 },
  { value: 'hard', label: 'Сложная', xp: 30 },
]

export const DIFFICULTY_LABELS = Object.fromEntries(
  DIFFICULTIES.map((item) => [item.value, item.label]),
)

/* --- Частота выполнения ------------------------------------------------- */

export const FREQUENCIES = [
  { value: 'daily', label: 'Каждый день' },
  { value: 'weekly', label: 'Раз в неделю' },
  { value: 'monthly', label: 'Раз в месяц' },
]

export const FREQUENCY_LABELS = Object.fromEntries(
  FREQUENCIES.map((item) => [item.value, item.label]),
)

/* --- Варианты сортировки таблицы привычек ------------------------------- */

export const SORT_OPTIONS = [
  { value: 'created_at', label: 'По дате создания' },
  { value: 'name', label: 'По названию' },
  { value: 'streak', label: 'По серии' },
]

/* --- Периоды статистики ------------------------------------------------- */

export const PERIODS = [
  { value: 'day', label: 'День' },
  { value: 'week', label: 'Неделя' },
  { value: 'month', label: 'Месяц' },
]

/* --- Цвета оформления --------------------------------------------------- */

/**
 * Сервер отдаёт цвет категории в виде HEX (#10B981). Готовые классы
 * оформления рассчитаны на несколько названий, поэтому HEX переводится
 * в ближайший тон, а сам цвет используется как акцент иконки.
 */
export const TONES = ['purple', 'orange', 'green', 'blue']

export function toneByIndex(index) {
  return TONES[index % TONES.length]
}

/* --- Правила уровней ---------------------------------------------------- */

/**
 * Порог уровня по правилу из документации: уровень L начинается
 * с 100 × (L − 1) × L / 2 опыта (1 → 0, 2 → 100, 3 → 300, 4 → 600, 5 → 1000).
 */
export function xpForLevel(level) {
  return (100 * (level - 1) * level) / 2
}

/** Определить уровень по количеству опыта. */
export function levelFromXp(xp) {
  let level = 1
  while (xpForLevel(level + 1) <= xp) level += 1
  return level
}

/** Прогресс до следующего уровня в процентах. */
export function levelProgress(xp) {
  const level = levelFromXp(xp)
  const current = xp - xpForLevel(level)
  const target = xpForLevel(level + 1) - xpForLevel(level)
  return {
    level,
    current,
    target,
    percent: target > 0 ? Math.min(Math.round((current / target) * 100), 100) : 100,
  }
}

/** Названия уровней — используются в карточке прогресса. */
export const LEVEL_TITLES = [
  'Новичок',
  'Ученик',
  'Практик',
  'Создатель привычек',
  'Хранитель серии',
  'Мастер дисциплины',
]

export function levelTitle(level) {
  return LEVEL_TITLES[Math.min(level - 1, LEVEL_TITLES.length - 1)] ?? LEVEL_TITLES[0]
}
