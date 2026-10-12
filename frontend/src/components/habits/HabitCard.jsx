/**
 * Карточка привычки в списке.
 *
 * Данные приходят с сервера: название, категория, сложность, текущая серия
 * и признак «выполнено сегодня». Кнопка отметки сообщает состояние
 * скринридеру через aria-pressed, а пока запрос выполняется — блокируется.
 */

import { Link } from 'react-router-dom'
import { Check, Flame, Loader2 } from 'lucide-react'
import { iconByName, toneByColor } from '../../utils/icons.js'
import { DIFFICULTY_LABELS } from '../../utils/constants.js'

export default function HabitCard({ habit, onToggle, busy = false, showLink = true }) {
  const Icon = iconByName(habit.category?.icon)
  const tone = toneByColor(habit.category?.color)
  const done = Boolean(habit.completed_today)

  const title = showLink ? (
    <Link className="habit-title" to={`/app/habits/${habit.id}`}>
      {habit.name}
    </Link>
  ) : (
    <b>{habit.name}</b>
  )

  return (
    <article className={`habit-card ${done ? 'done' : ''}`}>
      <div className={`habit-icon ${tone}`}>
        <Icon size={20} />
      </div>

      <div className="habit-info">
        {title}
        <small>
          {habit.category?.name ?? 'Без категории'}
          <i />
          {DIFFICULTY_LABELS[habit.difficulty] ?? habit.difficulty}
          {habit.current_streak > 0 ? (
            <>
              <i />
              <Flame size={11} /> {habit.current_streak}
            </>
          ) : null}
        </small>
      </div>

      <span className="xp-badge">+{habit.xp_per_completion ?? 10} XP</span>

      <button
        type="button"
        className={`check ${done ? 'checked' : ''}`}
        onClick={() => onToggle(habit)}
        disabled={busy}
        aria-pressed={done}
        aria-label={done ? `Снять отметку с привычки «${habit.name}»` : `Отметить привычку «${habit.name}»`}
      >
        {busy ? <Loader2 size={15} className="spin" /> : done ? <Check size={16} /> : null}
      </button>
    </article>
  )
}
