/**
 * Заглушки на время загрузки данных (задание 7).
 *
 * Пока сервер отвечает, вместо пустого места показываются серые блоки,
 * повторяющие форму будущего содержимого. Так интерфейс не «прыгает».
 */

export default function Skeleton({ width = '100%', height = 14, radius = 8, className = '' }) {
  return (
    <span
      className={`skeleton ${className}`.trim()}
      style={{ width, height, borderRadius: radius }}
      aria-hidden="true"
    />
  )
}

/** Заглушка списка привычек. */
export function HabitListSkeleton({ rows = 3 }) {
  return (
    <div className="habit-list" aria-hidden="true">
      {Array.from({ length: rows }).map((_, index) => (
        <div className="habit-card skeleton-card" key={index}>
          <Skeleton width={42} height={42} radius={13} />
          <div className="skeleton-lines">
            <Skeleton width="55%" height={12} />
            <Skeleton width="35%" height={10} />
          </div>
          <Skeleton width={54} height={20} radius={7} />
          <Skeleton width={27} height={27} radius={9} />
        </div>
      ))}
    </div>
  )
}

/** Заглушка таблицы. */
export function TableSkeleton({ rows = 6, columns = 5 }) {
  return (
    <div className="table-skeleton" aria-hidden="true">
      <Skeleton width="100%" height={38} radius={10} />
      {Array.from({ length: rows }).map((_, rowIndex) => (
        <div className="table-skeleton-row" key={rowIndex}>
          {Array.from({ length: columns }).map((__, cellIndex) => (
            <Skeleton key={cellIndex} width={cellIndex === 0 ? '70%' : '50%'} height={12} />
          ))}
        </div>
      ))}
    </div>
  )
}

/** Заглушка карточек показателей. */
export function StatCardsSkeleton({ count = 4 }) {
  return (
    <div className="stats-grid" aria-hidden="true">
      {Array.from({ length: count }).map((_, index) => (
        <div className="stat-card" key={index}>
          <Skeleton width={39} height={39} radius={12} />
          <div className="skeleton-lines" style={{ marginTop: 14 }}>
            <Skeleton width="60%" height={11} />
            <Skeleton width="45%" height={24} />
          </div>
        </div>
      ))}
    </div>
  )
}
