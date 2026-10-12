/**
 * Постраничная навигация.
 *
 * Сервер отдаёт `page`, `limit` и `pages`, поэтому компонент только
 * показывает номера страниц и сообщает выбранную наверх. Слишком длинный
 * список номеров сокращается многоточием.
 */

import { ChevronLeft, ChevronRight } from 'lucide-react'

/** Построить список номеров страниц с пропусками: 1 … 4 5 6 … 12 */
function buildPages(page, pages) {
  if (pages <= 7) return Array.from({ length: pages }, (_, index) => index + 1)

  const result = new Set([1, pages, page, page - 1, page + 1])
  const sorted = [...result].filter((value) => value >= 1 && value <= pages).sort((a, b) => a - b)

  const output = []
  let previous = 0
  sorted.forEach((value) => {
    if (previous && value - previous > 1) output.push(`gap-${value}`)
    output.push(value)
    previous = value
  })
  return output
}

export default function Pagination({ page = 1, pages = 1, total, limit, onChange }) {
  if (pages <= 1) return null

  const items = buildPages(page, pages)

  return (
    <nav className="pagination" aria-label="Постраничная навигация">
      <button
        type="button"
        className="pagination-arrow"
        onClick={() => onChange(page - 1)}
        disabled={page <= 1}
        aria-label="Предыдущая страница"
      >
        <ChevronLeft size={16} />
      </button>

      {items.map((item) =>
        typeof item === 'string' ? (
          <span className="pagination-gap" key={item} aria-hidden="true">
            …
          </span>
        ) : (
          <button
            type="button"
            key={item}
            className={`pagination-page ${item === page ? 'active' : ''}`}
            aria-current={item === page ? 'page' : undefined}
            onClick={() => onChange(item)}
          >
            {item}
          </button>
        ),
      )}

      <button
        type="button"
        className="pagination-arrow"
        onClick={() => onChange(page + 1)}
        disabled={page >= pages}
        aria-label="Следующая страница"
      >
        <ChevronRight size={16} />
      </button>

      {total !== undefined ? (
        <span className="pagination-total">
          Всего записей: {total}
          {limit ? `, по ${limit} на странице` : ''}
        </span>
      ) : null}
    </nav>
  )
}
