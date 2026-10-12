/**
 * Слайдер привычек (задание 7).
 *
 * Слайды загружаются из базы данных: это привычки пользователя, полученные
 * от API. Реализованы автопрокрутка, стрелки, точки и свайп на телефоне.
 *
 * Слайдер собственный, а не библиотечный: так в проекте не появляется лишняя
 * зависимость, а поведение полностью под контролем. При системной настройке
 * prefers-reduced-motion автопрокрутка отключается.
 */

import { useCallback, useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { ChevronLeft, ChevronRight, Flame, Sparkles, Target } from 'lucide-react'
import { iconByName, toneByColor } from '../../utils/icons.js'
import { DIFFICULTY_LABELS } from '../../utils/constants.js'
import { pluralizeWithCount } from '../../utils/format.js'
import Skeleton from '../ui/Skeleton.jsx'

const AUTOPLAY_DELAY = 5000
const SWIPE_THRESHOLD = 45

export default function HabitSlider({ habits = [], loading = false }) {
  const [index, setIndex] = useState(0)
  const [paused, setPaused] = useState(false)
  const touchStartX = useRef(null)

  const count = habits.length
  const slides = habits.slice(0, 6)

  // Если список изменился и текущий слайд исчез, возвращаемся к первому.
  useEffect(() => {
    if (index >= slides.length) setIndex(0)
  }, [index, slides.length])

  // Автопрокрутка. Останавливается при наведении, фокусе внутри слайдера
  // и при отключённых анимациях в системе.
  useEffect(() => {
    if (paused || slides.length <= 1) return undefined
    if (window.matchMedia?.('(prefers-reduced-motion: reduce)').matches) return undefined

    const timer = setInterval(() => {
      setIndex((current) => (current + 1) % slides.length)
    }, AUTOPLAY_DELAY)

    return () => clearInterval(timer)
  }, [paused, slides.length])

  const goTo = useCallback(
    (next) => {
      if (slides.length === 0) return
      setIndex(((next % slides.length) + slides.length) % slides.length)
    },
    [slides.length],
  )

  const next = useCallback(() => goTo(index + 1), [goTo, index])
  const previous = useCallback(() => goTo(index - 1), [goTo, index])

  /** Свайп на телефоне: сравниваем начало и конец касания. */
  function handleTouchStart(event) {
    touchStartX.current = event.touches[0].clientX
  }

  function handleTouchEnd(event) {
    if (touchStartX.current === null) return
    const delta = event.changedTouches[0].clientX - touchStartX.current
    if (Math.abs(delta) > SWIPE_THRESHOLD) {
      if (delta < 0) next()
      else previous()
    }
    touchStartX.current = null
  }

  /** Управление стрелками клавиатуры. */
  function handleKeyDown(event) {
    if (event.key === 'ArrowRight') next()
    if (event.key === 'ArrowLeft') previous()
  }

  if (loading) {
    return (
      <section className="slider slider-loading" aria-busy="true">
        <div className="slider-slide">
          <Skeleton width={120} height={22} radius={11} />
          <Skeleton width="60%" height={26} />
          <Skeleton width="85%" height={13} />
          <Skeleton width={160} height={38} radius={11} />
        </div>
      </section>
    )
  }

  if (slides.length === 0) return null

  return (
    <section
      className="slider"
      aria-roledescription="карусель"
      aria-label="Привычки в работе"
      tabIndex={0}
      onKeyDown={handleKeyDown}
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      onFocus={() => setPaused(true)}
      onBlur={() => setPaused(false)}
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
    >
      <div className="slider-track" style={{ transform: `translateX(-${index * 100}%)` }}>
        {slides.map((habit, slideIndex) => {
          const Icon = iconByName(habit.category?.icon)
          const tone = toneByColor(habit.category?.color)

          return (
            <article
              className="slider-slide"
              key={habit.id}
              aria-hidden={slideIndex !== index}
              aria-roledescription="слайд"
              aria-label={`${slideIndex + 1} из ${slides.length}`}
            >
              <span className={`slider-badge ${tone}`}>
                <Icon size={14} />
                {habit.category?.name ?? 'Без категории'}
              </span>

              <h2>{habit.name}</h2>
              <p>{habit.description || 'Привычка без описания. Выполняйте её каждый день и получайте опыт.'}</p>

              <div className="slider-stats">
                <span>
                  <Flame size={15} />
                  {habit.current_streak > 0
                    ? pluralizeWithCount(habit.current_streak, 'день', 'дня', 'дней')
                    : 'серия не начата'}
                </span>
                <span>
                  <Sparkles size={15} />+{habit.xp_per_completion ?? 10} XP за выполнение
                </span>
                <span>
                  <Target size={15} />
                  {DIFFICULTY_LABELS[habit.difficulty] ?? habit.difficulty}
                </span>
              </div>

              <Link className="primary-button" to={`/app/habits/${habit.id}`} tabIndex={slideIndex === index ? 0 : -1}>
                Открыть привычку
              </Link>
            </article>
          )
        })}
      </div>

      {slides.length > 1 ? (
        <>
          <button type="button" className="slider-arrow slider-prev" onClick={previous} aria-label="Предыдущий слайд">
            <ChevronLeft size={18} />
          </button>
          <button type="button" className="slider-arrow slider-next" onClick={next} aria-label="Следующий слайд">
            <ChevronRight size={18} />
          </button>

          <div className="slider-dots" role="tablist" aria-label="Выбор слайда">
            {slides.map((habit, dotIndex) => (
              <button
                type="button"
                key={habit.id}
                role="tab"
                aria-selected={dotIndex === index}
                aria-label={`Слайд ${dotIndex + 1}: ${habit.name}`}
                className={`slider-dot ${dotIndex === index ? 'active' : ''}`}
                onClick={() => goTo(dotIndex)}
              />
            ))}
          </div>
        </>
      ) : null}
    </section>
  )
}
