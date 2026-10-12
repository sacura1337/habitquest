/**
 * График выполнения на CSS.
 *
 * Данные — это точки из GET /api/statistics/progress. Задание 5 требует
 * современную раскладку вместо «табличной вёрстки», поэтому столбцы построены
 * на Flexbox: высота считается из процента выполнения, дополнительная
 * библиотека графиков не нужна.
 */

import { Activity } from 'lucide-react'
import { formatShortDate, formatWeekday } from '../../utils/format.js'

export default function WeeklyChart({ points = [], compact = false, title, subtitle }) {
  const maxPercent = Math.max(...points.map((point) => point.percent ?? 0), 1)
  const total = points.reduce((sum, point) => sum + (point.completed ?? 0), 0)
  const average = points.length
    ? Math.round(points.reduce((sum, point) => sum + (point.percent ?? 0), 0) / points.length)
    : 0

  const best = points.reduce(
    (accumulator, point) => ((point.percent ?? 0) > (accumulator?.percent ?? -1) ? point : accumulator),
    null,
  )

  return (
    <section className="panel progress-panel">
      <div className="section-heading">
        <div>
          <h2>{title ?? 'Твой прогресс'}</h2>
          <p>{subtitle ?? 'Активность за последние дни'}</p>
        </div>
      </div>

      <div className="chart-summary">
        <span>
          <i />
          Выполнено привычек
        </span>
        <b>
          {total} <small>за период</small>
        </b>
      </div>

      <div
        className={`chart ${compact ? '' : 'big-chart'}`}
        role="img"
        aria-label={`График выполнения привычек: в среднем ${average} процентов за период`}
      >
        {points.map((point) => {
          const isBest = best && point.date === best.date
          return (
            <div className="bar-col" key={point.date}>
              <div
                className={`bar ${isBest ? 'highlight' : ''}`}
                style={{ height: `${Math.max((point.percent / maxPercent) * 100, 4)}%` }}
                title={`${formatShortDate(point.date)}: ${point.completed} из ${point.total}`}
              />
              <small>{formatShortDate(point.date)}</small>
            </div>
          )
        })}
      </div>

      <div className="chart-foot">
        <span>
          <Activity size={14} /> {average}%
        </span>
        средний процент выполнения за период
      </div>
    </section>
  )
}
