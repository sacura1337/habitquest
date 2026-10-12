/**
 * Три состояния загрузки данных: «Загрузка…», «Ничего не найдено», «Ошибка сервера».
 *
 * Требование задания 5 — показывать эти состояния явно. Компонент
 * используется всеми страницами, поэтому текст и оформление одинаковы везде.
 */

import { Inbox, RefreshCw, ServerCrash } from 'lucide-react'
import Button from './Button.jsx'
import { TableSkeleton } from './Skeleton.jsx'

export default function StateBlock({
  loading,
  error,
  isEmpty,
  onRetry,
  skeleton,
  emptyIcon: EmptyIcon = Inbox,
  emptyTitle = 'Ничего не найдено',
  emptyText = 'Попробуйте изменить условия поиска или фильтры.',
  emptyAction,
  children,
}) {
  if (loading) {
    return skeleton ?? <TableSkeleton />
  }

  if (error) {
    return (
      <div className="state-block state-error" role="alert">
        <span className="state-icon">
          <ServerCrash size={26} />
        </span>
        <h2>Ошибка сервера</h2>
        <p>{error.message || 'Не удалось загрузить данные.'}</p>
        {error.status ? <small className="state-code">Код ответа: {error.status}</small> : null}
        {onRetry ? (
          <Button variant="secondary" icon={RefreshCw} onClick={onRetry}>
            Повторить запрос
          </Button>
        ) : null}
      </div>
    )
  }

  if (isEmpty) {
    return (
      <div className="state-block">
        <span className="state-icon">
          <EmptyIcon size={26} />
        </span>
        <h2>{emptyTitle}</h2>
        <p>{emptyText}</p>
        {emptyAction}
      </div>
    )
  }

  return children
}
