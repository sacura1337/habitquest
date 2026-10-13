/**
 * Таблица данных (задание 5).
 *
 * Компонент отвечает только за разметку: набор колонок приходит снаружи,
 * сортировка — тоже (сервер сортирует привычки сам, история сортируется
 * на клиенте). Заголовки сортируемых колонок — кнопки, а текущее
 * направление сообщается атрибутом aria-sort.
 *
 * На телефоне таблица превращается в карточки: подписи колонок выводятся
 * из атрибута data-label средствами CSS.
 */

export default function DataTable({
  columns,
  items,
  rowKey = (item) => item.id,
  sort,
  order = 'desc',
  onSort,
  caption,
}) {
  return (
    <div className="table-wrapper">
      <table className="data-table">
        {caption ? <caption className="visually-hidden">{caption}</caption> : null}

        <thead>
          <tr>
            {columns.map((column) => {
              const isSorted = sort === column.key
              const ariaSort = isSorted ? (order === 'asc' ? 'ascending' : 'descending') : undefined

              return (
                <th key={column.key} scope="col" className={column.className ?? ''} aria-sort={ariaSort}>
                  {column.sortable && onSort ? (
                    <button
                      type="button"
                      className={`th-sort ${isSorted ? 'active' : ''}`}
                      onClick={() => onSort(column.key)}
                      title={`Сортировать по столбцу «${column.label}»`}
                    >
                      {column.label}
                      <span className="sort-icon" aria-hidden="true">
                        {isSorted ? (order === 'asc' ? '▲' : '▼') : '↕'}
                      </span>
                    </button>
                  ) : (
                    column.label
                  )}
                </th>
              )
            })}
          </tr>
        </thead>

        <tbody>
          {items.map((item) => (
            <tr key={rowKey(item)}>
              {columns.map((column) => (
                <td key={column.key} data-label={column.label} className={column.className ?? ''}>
                  {column.render ? column.render(item) : item[column.key]}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
