/**
 * Раздел «Статистика» (задания 5 и 7).
 *
 * Сводка за период считается сервером (GET /api/statistics/summary),
 * точки графика приходят из GET /api/statistics/progress, история выполнения —
 * из GET /api/statistics/history. История выводится таблицей с сортировкой
 * по столбцам и постраничной навигацией.
 */

import { useCallback, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { Activity, BarChart3, CalendarDays, Flame, Sparkles, Target } from 'lucide-react'
import WeeklyChart from '../components/stats/WeeklyChart.jsx'
import StatCard from '../components/stats/StatCard.jsx'
import DataTable from '../components/ui/DataTable.jsx'
import Pagination from '../components/ui/Pagination.jsx'
import StateBlock from '../components/ui/StateBlock.jsx'
import Reveal from '../components/ui/Reveal.jsx'
import { TableSkeleton } from '../components/ui/Skeleton.jsx'
import { statistics } from '../api/index.js'
import { useFetch } from '../hooks/useFetch.js'
import { PERIODS } from '../utils/constants.js'
import { formatDateTime, formatNumber, pluralize } from '../utils/format.js'

const HISTORY_PAGE_SIZE = 8
const RANGE_OPTIONS = [
  { value: 7, label: '7 дней' },
  { value: 14, label: '14 дней' },
  { value: 30, label: '30 дней' },
  { value: 90, label: '90 дней' },
]

export default function StatisticsPage() {
  const [period, setPeriod] = useState('week')
  const [days, setDays] = useState(30)
  const [historyPage, setHistoryPage] = useState(1)

  // Сортировка истории выполняется в браузере: сервер отдаёт записи
  // от новых к старым, а пользователь может изменить порядок.
  const [sort, setSort] = useState('completed_at')
  const [order, setOrder] = useState('desc')

  const loadSummary = useCallback(() => statistics.summary(period), [period])
  const loadProgress = useCallback(() => statistics.progress(days), [days])
  const loadHistory = useCallback(
    () =>
      statistics.history({
        limit: HISTORY_PAGE_SIZE,
        offset: (historyPage - 1) * HISTORY_PAGE_SIZE,
      }),
    [historyPage],
  )

  const summary = useFetch(loadSummary, [period])
  const progress = useFetch(loadProgress, [days])
  const history = useFetch(loadHistory, [historyPage])

  const historyItems = history.data?.items ?? []
  const historyTotal = history.data?.total ?? 0
  const historyPages = Math.max(Math.ceil(historyTotal / HISTORY_PAGE_SIZE), 1)

  /** Сортировка полученной страницы истории по выбранному столбцу. */
  const sortedHistory = useMemo(() => {
    const copy = [...historyItems]
    copy.sort((first, second) => {
      const left = first[sort]
      const right = second[sort]
      if (left === right) return 0
      const result = left > right ? 1 : -1
      return order === 'asc' ? result : -result
    })
    return copy
  }, [historyItems, sort, order])

  function handleSort(key) {
    if (sort === key) {
      setOrder((current) => (current === 'asc' ? 'desc' : 'asc'))
    } else {
      setSort(key)
      setOrder(key === 'habit_name' ? 'asc' : 'desc')
    }
  }

  const columns = useMemo(
    () => [
      {
        key: 'completed_at',
        label: 'Дата и время',
        sortable: true,
        render: (item) => formatDateTime(item.completed_at),
      },
      {
        key: 'habit_name',
        label: 'Привычка',
        sortable: true,
        render: (item) => (
          <Link className="table-link" to={`/app/habits/${item.habit_id}`}>
            {item.habit_name}
          </Link>
        ),
      },
      {
        key: 'category_name',
        label: 'Категория',
        sortable: true,
        render: (item) => item.category_name ?? '—',
      },
      {
        key: 'xp_earned',
        label: 'Опыт',
        sortable: true,
        render: (item) => <span className="xp-badge">+{item.xp_earned} XP</span>,
      },
    ],
    [],
  )

  const categories = summary.data?.by_category ?? []
  const maxCategoryCount = Math.max(...categories.map((item) => item.count ?? 0), 1)
  const periodLabel = PERIODS.find((item) => item.value === period)?.label ?? ''

  return (
    <>
      <section className="welcome">
        <div>
          <p className="date">HabitQuest / Статистика</p>
          <h1>Твой прогресс</h1>
          <p className="sub">Отслеживай результаты и замечай, как меняется регулярность.</p>
        </div>

        <div className="view-switch period-switch" role="group" aria-label="Период статистики">
          {PERIODS.map((item) => (
            <button
              key={item.value}
              type="button"
              className={period === item.value ? 'active' : ''}
              onClick={() => setPeriod(item.value)}
              aria-pressed={period === item.value}
            >
              {item.label}
            </button>
          ))}
        </div>
      </section>

      {/* Сводка за выбранный период */}
      <section className="panel summary-panel">
        <div className="section-heading">
          <div>
            <h2>Сводка: {periodLabel.toLowerCase()}</h2>
            <p>
              {summary.data
                ? `период с ${summary.data.from} по ${summary.data.to}`
                : 'данные загружаются'}
            </p>
          </div>
          <CalendarDays size={20} className="gold" />
        </div>

        <StateBlock
          loading={summary.loading}
          error={summary.error}
          isEmpty={false}
          onRetry={summary.reload}
          skeleton={<TableSkeleton rows={2} columns={4} />}
        >
          <div className="stats-grid summary-grid">
            <StatCard
              icon={Target}
              label="Выполнено"
              value={formatNumber(summary.data?.total_completions ?? 0)}
              suffix="раз"
              tone="purple"
              note={`Из ${summary.data?.possible_completions ?? 0} возможных`}
            />
            <StatCard
              icon={Activity}
              label="Процент выполнения"
              value={summary.data?.completion_percent ?? 0}
              suffix="%"
              tone="green"
              note={`Активных привычек: ${summary.data?.active_habits ?? 0}`}
            />
            <StatCard
              icon={Sparkles}
              label="Получено опыта"
              value={formatNumber(summary.data?.xp_earned ?? 0)}
              suffix="XP"
              tone="blue"
            />
            <StatCard
              icon={Flame}
              label="Лучшая серия"
              value={summary.data?.best_streak ?? 0}
              suffix="дней"
              tone="orange"
            />
          </div>
        </StateBlock>
      </section>

      <Reveal>
        <div className="chart-controls">
          <span>Диапазон графика:</span>
          {RANGE_OPTIONS.map((option) => (
            <button
              key={option.value}
              type="button"
              className={`chip ${days === option.value ? 'active' : ''}`}
              onClick={() => setDays(option.value)}
              aria-pressed={days === option.value}
            >
              {option.label}
            </button>
          ))}
        </div>

        <StateBlock
          loading={progress.loading}
          error={progress.error}
          isEmpty={(progress.data ?? []).length === 0}
          onRetry={progress.reload}
          skeleton={<TableSkeleton rows={3} columns={6} />}
          emptyTitle="Нет данных за период"
          emptyText="Отметьте выполнение привычек, чтобы построить график."
        >
          <WeeklyChart
            points={progress.data ?? []}
            compact={days > 30}
            title="Выполнение по дням"
            subtitle={`Диапазон: ${days} ${pluralize(days, 'день', 'дня', 'дней')}`}
          />
        </StateBlock>
      </Reveal>

      {/* Разбивка по категориям */}
      <Reveal className="panel categories-panel">
        <div className="section-heading">
          <div>
            <h2>Выполнение по категориям</h2>
            <p>Сколько раз выполнены привычки каждой категории за период</p>
          </div>
          <BarChart3 size={20} className="gold" />
        </div>

        {categories.length === 0 ? (
          <p className="sub">За выбранный период данных нет.</p>
        ) : (
          <ul className="category-list">
            {categories.map((item) => (
              <li key={item.category_id}>
                <span className="category-name">
                  <i style={{ background: item.color ?? 'var(--primary)' }} />
                  {item.name}
                </span>
                <span className="category-bar">
                  <span style={{ width: `${Math.round((item.count / maxCategoryCount) * 100)}%` }} />
                </span>
                <b>{item.count}</b>
              </li>
            ))}
          </ul>
        )}
      </Reveal>

      {/* История выполнения всех привычек */}
      <section className="panel table-panel">
        <div className="section-heading">
          <div>
            <h2>История выполнения</h2>
            <p>Все отметки из базы данных, отсортированные по выбранному столбцу</p>
          </div>
        </div>

        <StateBlock
          loading={history.loading}
          error={history.error}
          isEmpty={historyItems.length === 0}
          onRetry={history.reload}
          emptyTitle="Записей пока нет"
          emptyText="Как только вы отметите привычку, запись появится здесь."
        >
          <DataTable
            caption="История выполнения всех привычек"
            columns={columns}
            items={sortedHistory}
            sort={sort}
            order={order}
            onSort={handleSort}
          />
          <Pagination
            page={historyPage}
            pages={historyPages}
            total={historyTotal}
            limit={HISTORY_PAGE_SIZE}
            onChange={setHistoryPage}
          />
        </StateBlock>
      </section>
    </>
  )
}
