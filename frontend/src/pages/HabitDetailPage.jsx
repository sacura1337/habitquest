/**
 * Страница одной привычки (динамический маршрут /app/habits/:id).
 *
 * Задание 4 требует динамические маршруты для отдельных объектов, задание 5 —
 * таблицу с сортировкой и постраничной навигацией. Здесь показана история
 * выполнения привычки с фильтром по периоду и страницами, а также подробная
 * статистика и действия над записью.
 */

import { useCallback, useEffect, useMemo, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import {
  ArrowLeft,
  CalendarRange,
  Check,
  Flame,
  Loader2,
  Pencil,
  Percent,
  Repeat,
  Trash2,
  Trophy,
} from 'lucide-react'
import DataTable from '../components/ui/DataTable.jsx'
import Pagination from '../components/ui/Pagination.jsx'
import StateBlock from '../components/ui/StateBlock.jsx'
import Modal from '../components/ui/Modal.jsx'
import Button from '../components/ui/Button.jsx'
import HabitForm from '../components/habits/HabitForm.jsx'
import StatCard from '../components/stats/StatCard.jsx'
import { TableSkeleton } from '../components/ui/Skeleton.jsx'
import { useBreadcrumb } from '../components/layout/Breadcrumbs.jsx'
import { categories as categoriesApi, habits as habitsApi } from '../api/index.js'
import { useFetch } from '../hooks/useFetch.js'
import { useHabitToggle } from '../hooks/useHabitToggle.js'
import { useToast } from '../context/ToastContext.jsx'
import { DIFFICULTY_LABELS, FREQUENCY_LABELS } from '../utils/constants.js'
import { formatDateTime, formatNumber, toInputDate } from '../utils/format.js'
import { iconByName, toneByColor } from '../utils/icons.js'

const HISTORY_PAGE_SIZE = 10

export default function HabitDetailPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { notify } = useToast()

  const [historyPage, setHistoryPage] = useState(1)
  const [dateFrom, setDateFrom] = useState('')
  const [dateTo, setDateTo] = useState('')

  const [formOpen, setFormOpen] = useState(false)
  const [saving, setSaving] = useState(false)
  const [confirmOpen, setConfirmOpen] = useState(false)
  const [deleting, setDeleting] = useState(false)

  // --- Загрузка привычки и истории ---------------------------------------
  const loadHabit = useCallback(() => habitsApi.get(id), [id])
  const habitState = useFetch(loadHabit, [id])

  const loadHistory = useCallback(
    () =>
      habitsApi.completions(id, {
        limit: HISTORY_PAGE_SIZE,
        offset: (historyPage - 1) * HISTORY_PAGE_SIZE,
        date_from: dateFrom || undefined,
        date_to: dateTo || undefined,
      }),
    [id, historyPage, dateFrom, dateTo],
  )

  const history = useFetch(loadHistory, [id, historyPage, dateFrom, dateTo])

  const loadCategories = useCallback(() => categoriesApi.list(), [])
  const categoryList = useFetch(loadCategories, [])

  const habit = habitState.data

  // Имя привычки подставляется в хлебные крошки и заголовок вкладки.
  useBreadcrumb(habit?.name)

  useEffect(() => {
    document.title = habit?.name ? `${habit.name} — HabitQuest` : 'HabitQuest'
    return () => {
      document.title = 'HabitQuest — твой прогресс каждый день'
    }
  }, [habit?.name])

  // Смена фильтра периода возвращает на первую страницу истории.
  useEffect(() => {
    setHistoryPage(1)
  }, [dateFrom, dateTo])

  const reloadAll = useCallback(() => {
    habitState.reload()
    history.reload()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [habitState.reload, history.reload])

  const { toggle, busyId } = useHabitToggle(reloadAll)

  /** Изменение привычки. Ошибка пробрасывается в форму. */
  async function handleSubmit(payload) {
    setSaving(true)
    try {
      await habitsApi.update(id, payload)
      notify('Изменения сохранены')
      setFormOpen(false)
      reloadAll()
    } finally {
      setSaving(false)
    }
  }

  /** Удаление привычки и возврат к списку. */
  async function handleDelete() {
    setDeleting(true)
    try {
      await habitsApi.remove(id)
      notify(`Привычка «${habit?.name}» удалена`, 'info')
      navigate('/app/habits', { replace: true })
    } catch (error) {
      notify(error.message, 'error')
      setDeleting(false)
    }
  }

  /** Столбцы таблицы истории выполнения. */
  const historyColumns = useMemo(
    () => [
      {
        key: 'completed_at',
        label: 'Дата и время',
        render: (item) => formatDateTime(item.completed_at),
      },
      {
        key: 'date',
        label: 'Дата',
        render: (item) => toInputDate(item.completed_at),
      },
      {
        key: 'xp_earned',
        label: 'Опыт',
        render: (item) => <span className="xp-badge">+{item.xp_earned} XP</span>,
      },
      {
        key: 'id',
        label: 'Запись',
        render: (item) => <span className="cell-muted">№ {item.id}</span>,
      },
    ],
    [],
  )

  // Отдельный случай: привычка не найдена или принадлежит другому пользователю.
  if (habitState.error && !habitState.loading) {
    const notFound = [403, 404].includes(habitState.error.status)
    return (
      <StateBlock
        loading={false}
        error={notFound ? null : habitState.error}
        isEmpty={notFound}
        onRetry={habitState.reload}
        emptyTitle="Привычка не найдена"
        emptyText="Возможно, она была удалена или принадлежит другому пользователю."
        emptyAction={
          <Link className="primary-button" to="/app/habits">
            <ArrowLeft size={16} /> К списку привычек
          </Link>
        }
      >
        {null}
      </StateBlock>
    )
  }

  if (habitState.loading || !habit) {
    return (
      <section className="panel" aria-busy="true">
        <TableSkeleton rows={4} columns={4} />
      </section>
    )
  }

  const Icon = iconByName(habit.category?.icon)
  const tone = toneByColor(habit.category?.color)
  const historyItems = history.data?.items ?? []
  const historyTotal = history.data?.total ?? 0
  const historyPages = Math.max(Math.ceil(historyTotal / HISTORY_PAGE_SIZE), 1)

  return (
    <>
      <section className="welcome detail-welcome">
        <div className="detail-title">
          <span className={`habit-icon ${tone}`}>
            <Icon size={22} />
          </span>
          <div>
            <p className="date">
              {habit.category?.name ?? 'Без категории'} · {DIFFICULTY_LABELS[habit.difficulty] ?? habit.difficulty}
            </p>
            <h1>{habit.name}</h1>
            <p className="sub">
              {habit.description || 'Описание не заполнено.'}
            </p>
          </div>
        </div>

        <div className="detail-actions">
          <button
            type="button"
            className={`primary-button ${habit.completed_today ? 'is-done' : ''}`}
            onClick={() => toggle(habit)}
            disabled={busyId === habit.id}
          >
            {busyId === habit.id ? (
              <Loader2 size={17} className="spin" />
            ) : (
              <Check size={17} />
            )}
            {habit.completed_today ? 'Выполнено сегодня' : 'Отметить выполнение'}
          </button>

          <button type="button" className="secondary-button" onClick={() => setFormOpen(true)}>
            <Pencil size={16} /> Изменить
          </button>

          <Button variant="danger" icon={Trash2} onClick={() => setConfirmOpen(true)}>
            Удалить
          </Button>
        </div>
      </section>

      <section className="stats-grid" aria-label="Показатели привычки">
        <StatCard
          icon={Trophy}
          label="Всего выполнений"
          value={formatNumber(habit.total_completions ?? 0)}
          suffix="раз"
          tone="purple"
        />
        <StatCard
          icon={Flame}
          label="Текущая серия"
          value={habit.current_streak ?? 0}
          suffix="дней"
          tone="orange"
          note={`Лучшая серия: ${habit.max_streak ?? 0}`}
        />
        <StatCard
          icon={Percent}
          label="Процент выполнения"
          value={habit.completion_percent ?? 0}
          suffix="%"
          tone="green"
          note="За всё время"
        />
        <StatCard
          icon={Repeat}
          label="Частота"
          value={FREQUENCY_LABELS[habit.frequency] ?? habit.frequency}
          tone="blue"
          note={habit.reminder_time ? `Напоминание в ${String(habit.reminder_time).slice(0, 5)}` : 'Без напоминания'}
        />
      </section>

      <section className="panel table-panel">
        <div className="section-heading">
          <div>
            <h2>История выполнения</h2>
            <p>Записи из таблицы habit_completions, от новых к старым</p>
          </div>

          <div className="history-filters">
            <label>
              <CalendarRange size={14} />
              <input
                type="date"
                value={dateFrom}
                max={dateTo || undefined}
                onChange={(event) => setDateFrom(event.target.value)}
                aria-label="Начало периода"
              />
            </label>
            <span className="history-dash">—</span>
            <label>
              <input
                type="date"
                value={dateTo}
                min={dateFrom || undefined}
                onChange={(event) => setDateTo(event.target.value)}
                aria-label="Конец периода"
              />
            </label>
            {dateFrom || dateTo ? (
              <button
                type="button"
                className="link-button"
                onClick={() => {
                  setDateFrom('')
                  setDateTo('')
                }}
              >
                Сбросить
              </button>
            ) : null}
          </div>
        </div>

        <StateBlock
          loading={history.loading}
          error={history.error}
          isEmpty={historyItems.length === 0}
          onRetry={history.reload}
          emptyTitle="Отметок пока нет"
          emptyText="Отметьте выполнение привычки — запись появится в этой таблице."
        >
          <DataTable
            caption="История выполнения привычки"
            columns={historyColumns}
            items={historyItems}
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

      <HabitForm
        open={formOpen}
        habit={habit}
        categories={categoryList.data ?? []}
        saving={saving}
        onSubmit={handleSubmit}
        onClose={() => setFormOpen(false)}
      />

      <Modal
        open={confirmOpen}
        caption="УДАЛЕНИЕ"
        title="Удалить привычку?"
        onClose={() => setConfirmOpen(false)}
      >
        <p className="modal-text">
          Привычка «{habit.name}» и {formatNumber(historyTotal)} записей истории будут удалены
          безвозвратно.
        </p>
        <div className="modal-actions">
          <Button variant="secondary" onClick={() => setConfirmOpen(false)}>
            Отмена
          </Button>
          <Button variant="danger" icon={Trash2} loading={deleting} onClick={handleDelete}>
            Удалить
          </Button>
        </div>
      </Modal>
    </>
  )
}
