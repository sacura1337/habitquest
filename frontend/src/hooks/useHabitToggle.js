/**
 * Отметка выполнения привычки.
 *
 * Логика одинакова на всех страницах: отметить, снять отметку, показать
 * полученный опыт и новые достижения, сообщить об ошибке. Хук хранит
 * идентификатор привычки, по которой сейчас идёт запрос, чтобы заблокировать
 * именно её кнопку.
 */

import { useCallback, useState } from 'react'
import { habits as habitsApi } from '../api/index.js'
import { useToast } from '../context/ToastContext.jsx'

export function useHabitToggle(onDone) {
  const { notify } = useToast()
  const [busyId, setBusyId] = useState(null)

  const toggle = useCallback(
    async (habit) => {
      if (!habit?.id) return
      setBusyId(habit.id)

      try {
        if (habit.completed_today) {
          await habitsApi.uncomplete(habit.id)
          notify(`Отметка за сегодня снята: «${habit.name}»`, 'info')
        } else {
          const result = await habitsApi.complete(habit.id)
          const earned = result?.xp_earned ?? habit.xp_per_completion ?? 0

          notify(
            result?.level_up
              ? `Выполнено! +${earned} XP · Новый уровень ${result.level}`
              : `Выполнено! +${earned} XP`,
          )

          // Сервер сам решает, какие достижения открылись.
          ;(result?.unlocked_achievements ?? []).forEach((achievement) => {
            notify(`Новое достижение: ${achievement.name}`, 'success')
          })
        }

        onDone?.()
      } catch (error) {
        notify(error.message || 'Не удалось обновить отметку', 'error')
      } finally {
        setBusyId(null)
      }
    },
    [notify, onDone],
  )

  return { toggle, busyId }
}

export default useHabitToggle
