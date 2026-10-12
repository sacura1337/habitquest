/**
 * Раздел «Привычки» (задание 5 и 6).
 *
 * Здесь собраны обе табличные темы задания: таблица с сортировкой по столбцам,
 * поиском, фильтрами и постраничной навигацией, а также раскладка каталога
 * на CSS Grid — она переключается кнопкой и показывает современную замену
 * «табличной вёрстке».
 *
 * Данные приходят с сервера: поиск, фильтры, сортировка и страницы
 * выполняются на стороне API, а не в браузере.
 */

import { useCallback, useEffect, useMemo, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import {
  Check,
  Eye,
  Filter,
  LayoutGrid,
  Loader2,
  Pencil,
  Plus,
  Table2,
  Trash2,
  X,
} from 'lucide-react'
import DataTable from '../components/ui/DataTable.jsx'
import Pagination from '../components/ui/Pagination.jsx'
import StateBlock from '../components/ui/StateBlock.jsx'
import Modal from '../components/ui/Modal.jsx'
import Button from '../components/ui/Button.jsx'
import HabitForm from '../components/habits/HabitForm.jsx'
import { TableSkeleton } from '../components/ui/Skeleton.jsx'
import { categories as categoriesApi, habits as habitsApi } from '../api/index.js'
import { useFetch } from '../hooks/useFetch.js'
import { useDebounce } from '../hooks/useDebounce.js'
import { useHabitToggle } from '../hooks/useHabitToggle.js'
import { useToast } from '../context/ToastContext.jsx'
import { DIFFICULTIES, DIFFICULTY_LABELS, FREQUENCY_LABELS } from '../utils/constants.js'
import { formatDate, pluralize } from '../utils/format.js'
import { iconByName, toneByColor } from '../utils/icons.js'

const PAGE_SIZE = 9

const STATUS_OPTIONS = [
  { value: '', label: 'Все привычки' },
  { value: 'true', label: 'Только активные' },
  { value: 'false', label: 'Только архивные' },
]

/** Плитка каталога — раскладка на CSS Grid вместо строк таблицы. */
function HabitTile({ habit, onToggle, onEdit, onDelete, busy }) {
  const Icon = iconByName(habit.category?.icon)
  const tone = toneByColor(habit.category?.color)

  return (
    <article className={`catalog-card ${habit.completed_today ? 'done' : ''}`}>
      <header className="catalog-card-head">
        <span className={`habit-icon ${tone}`}>
          <Icon size={20} />
        </span>
        <span className="catalog-category">{habit.category?.name ?? 'Без категории'}</span>
      </header>

      <h3>
        <Link to={`/app/habits/${habit.id}`}>{habit.name}</Link>
      </h3>
      <p className="catalog-description">
        {habit.description || 'Описание не заполнено.'}
      </p>

      <dl className="catalog-meta">
        <div>
          <dt>Сложность</dt>
          <dd>{DIFFICULTY_LABELS[habit.difficulty] ?? habit.difficulty}</dd>
        </div>
        <div>
          <dt>Серия</dt>
          <dd>{habit.current_streak ?? 0} / {habit.max_streak ?? 0}</dd>
        </div>
        <div>
          <dt>Награда</dt>
          <dd>+{habit.xp_per_completion ?? 10} XP</dd>
        </div>
      </dl>

      <footer className="catalog-card-actions">
        <button
          type="button"
          className={`check ${habit.completed_today ? 'checked' : ''}`}
          onClick={() => onToggle(habit)}
          disabled={busy}
          aria-pressed={Boolean(habit.completed_today)}
          aria-label={habit.completed_today ? 'Снять отметку за сегодня' : 'Отметить выполнение'}
        >
          {busy ? <Loader2 size={15} className="spin" /> : habit.completed_today ? <Check size={16} /> : null}
        </button>

        <div className="row-actions">
          <Link className="icon-button" to={`/app/habits/${habit.id}`} aria-label="Открыть привычку">
            <Eye size={16} />
          </Link>
          <button type="button" className="icon-button" onClick={() => onEdit(habit)} aria-label="Изменить">
            <Pencil size={16} />
          </button>
          <button type="button" className="icon-button danger" onClick={() => onDelete(habit)} aria-label="Удалить">
            <Trash2 size={16} />
          </button>
        </div>
      </footer>
    </article>
  )
}

export default function HabitsPage() {
  const { notify } = useToast()
  const [searchParams] = useSearchParams()

  // --- Состояние фильтров -------------------------------------------------
  const [search, setSearch] = useState(searchParams.get('search') ?? '')
  const debouncedSearch = useDebounce(search, 400)
  const [categoryId, setCategoryId] = useState('')
  const [difficulty, setDifficulty] = useState('')
  const [status, setStatus] = useState('')
  const [sort, setSort] = useState('created_at')
  const [order, setOrder] = useState('desc')
  const [page, setPage] = useState(1)
  const [view, setView] = useState('table')

  // --- Состояние окон -----------------------------------------------------
  const [formOpen, setFormOpen] = useState(false)
  const [editing, setEditing] = useState(null)
  const [saving, setSaving] = useState(false)
  const [removing, setRemoving] = useState(null)
  const [deleting, setDeleting] = useState(false)

  // Поиск в шапке передаёт значение в адресе страницы.
  useEffect(() => {
    const fromUrl = searchParams.get('search')
    if (fromUrl !== null) setSearch(fromUrl)
  }, [searchParams])

  // Любое изменение условий возвращает на первую страницу.
  useEffect(() => {
    setPage(1)
  }, [debouncedSearch, categoryId, difficulty, status, sort, order])

  // --- Загрузка данных ----------------------------------------------------
  const loadCategories = useCallback(() => categoriesApi.list(), [])
  const categoryList = useFetch(loadCategories, [])
  const categories = categoryList.data ?? []

  const loadHabits = useCallback(
    () =>
      habitsApi.list({
        search: debouncedSearch || undefined,
        category_id: categoryId || undefined,
        difficulty: difficulty || undefined,
        is_active: status || undefined,
        sort,
        order,
        page,
        limit: PAGE_SIZE,
      }),
    [debouncedSearch, categoryId, difficulty, status, sort, order, page],
  )

  const list = useFetch(loadHabits, [debouncedSearch, categoryId, difficulty, status, sort, order, page])

  const items = list.data?.items ?? []
  const total = list.data?.total ?? 0
  const pages = list.data?.pages ?? 1

  const { toggle, busyId } = useHabitToggle(list.reload)

  const hasFilters = Boolean(debouncedSearch || categoryId || difficulty || status)

  /** Сортировка по клику на заголовок столбца. */
  function handleSort(key) {
    if (sort === key) {
      setOrder((current) => (current === 'asc' ? 'desc' : 'asc'))
    } else {
      setSort(key)
      setOrder(key === 'name' ? 'asc' : 'desc')
    }
  }

  function resetFilters() {
    setSearch('')
    setCategoryId('')
    setDifficulty('')
    setStatus('')
    setSort('created_at')
    setOrder('desc')
  }

  /** Создание или изменение привычки. Ошибку пробрасываем в форму. */
  async function handleSubmit(payload) {
    setSaving(true)
    try {
      if (editing) {
        await habitsApi.update(editing.id, payload)
        notify(`Привычка «${payload.name}» обновлена`)
      } else {
        await habitsApi.create(payload)
        notify(`Привычка «${payload.name}» создана`)
      }
      setFormOpen(false)
      setEditing(null)
      list.reload()
    } finally {
      setSaving(false)
    }
  }

  /** Удаление привычки после подтверждения. */
  async function confirmDelete() {
    if (!removing) return
    setDeleting(true)
    try {
      await habitsApi.remove(removing.id)
      notify(`Привычка «${removing.name}» удалена`, 'info')
      setRemoving(null)
      list.reload()
    } catch (error) {
      notify(error.message, 'error')
    } finally {
      setDeleting(false)
    }
  }

  // --- Описание столбцов таблицы -----------------------------------------
  const columns = useMemo(
    () => [
      {
        key: 'name',
        label: 'Привычка',
        sortable: true,
        render: (habit) => (
          <div className="cell-habit">
            <Link to={`/app/habits/${habit.id}`}>{habit.name}</Link>
            {habit.description ? <small>{habit.description}</small> : null}
          </div>
        ),
      },
      {
        key: 'category',
        label: 'Категория',
        render: (habit) => habit.category?.name ?? '—',
      },
      {
        key: 'difficulty',
        label: 'Сложность',
        render: (habit) => DIFFICULTY_LABELS[habit.difficulty] ?? habit.difficulty,
      },
      {
        key: 'frequency',
        label: 'Частота',
        render: (habit) => FREQUENCY_LABELS[habit.frequency] ?? habit.frequency,
      },
      {
        key: 'streak',
        label: 'Серия',
        sortable: true,
        render: (habit) => (
          <span className="cell-streak">
            {habit.current_streak ?? 0} <small>из {habit.max_streak ?? 0}</small>
          </span>
        ),
      },
      {
        key: 'xp',
        label: 'Награда',
        render: (habit) => <span className="xp-badge">+{habit.xp_per_completion ?? 10} XP</span>,
      },
      {
        key: 'created_at',
        label: 'Создана',
        sortable: true,
        render: (habit) => formatDate(habit.created_at),
      },
      {
        key: 'actions',
        label: 'Действия',
        className: 'cell-actions',
        render: (habit) => (
          <div className="row-actions">
            <button
              type="button"
              className={`icon-button ${habit.completed_today ? 'success' : ''}`}
              onClick={() => toggle(habit)}
              disabled={busyId === habit.id}
              aria-label={habit.completed_today ? 'Снять отметку за сегодня' : 'Отметить выполнение'}
              title={habit.completed_today ? 'Снять отметку за сегодня' : 'Отметить выполнение'}
            >
              {busyId === habit.id ? (
                <Loader2 size={16} className="spin" />
              ) : (
                <Check size={16} />
              )}
            </button>
            <Link className="icon-button" to={`/app/habits/${habit.id}`} aria-label="Открыть привычку">
              <Eye size={16} />
            </Link>
            <button
              type="button"
              className="icon-button"
              onClick={() => {
                setEditing(habit)
                setFormOpen(true)
              }}
              aria-label="Изменить привычку"
            >
              <Pencil size={16} />
            </button>
            <button
              type="button"
              className="icon-button danger"
              onClick={() => setRemoving(habit)}
              aria-label="Удалить привычку"
            >
              <Trash2 size={16} />
            </button>
          </div>
        ),
      },
    ],
    [busyId, toggle],
  )

  return (
    <>
      <section className="welcome">
        <div>
          <p className="date">HabitQuest / Привычки</p>
          <h1>Мои привычки</h1>
          <p className="sub">
            Управляй ежедневными действиями: создавай, отмечай и следи за сериями.
          </p>
        </div>

        <button
          type="button"
          className="primary-button"
          onClick={() => {
            setEditing(null)
            setFormOpen(true)
          }}
        >
          <Plus size={18} /> Новая привычка
        </button>
      </section>

      {/* Панель поиска и фильтров */}
      <section className="panel filters-panel">
        <div className="filters-row">
          <label className="filter-search">
            <Filter size={15} />
            <input
              type="search"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Поиск по названию и описанию"
              aria-label="Поиск привычек"
            />
            {search ? (
              <button type="button" onClick={() => setSearch('')} aria-label="Очистить поиск">
                <X size={14} />
              </button>
            ) : null}
          </label>

          <select
            value={categoryId}
            onChange={(event) => setCategoryId(event.target.value)}
            aria-label="Фильтр по категории"
          >
            <option value="">Все категории</option>
            {categories.map((category) => (
              <option key={category.id} value={category.id}>
                {category.name}
              </option>
            ))}
          </select>

          <select
            value={difficulty}
            onChange={(event) => setDifficulty(event.target.value)}
            aria-label="Фильтр по сложности"
          >
            <option value="">Любая сложность</option>
            {DIFFICULTIES.map((item) => (
              <option key={item.value} value={item.value}>
                {item.label}
              </option>
            ))}
          </select>

          <select value={status} onChange={(event) => setStatus(event.target.value)} aria-label="Фильтр по состоянию">
            {STATUS_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>

          <div className="view-switch" role="group" aria-label="Вид отображения">
            <button
              type="button"
              className={view === 'table' ? 'active' : ''}
              onClick={() => setView('table')}
              aria-pressed={view === 'table'}
            >
              <Table2 size={15} /> Таблица
            </button>
            <button
              type="button"
              className={view === 'grid' ? 'active' : ''}
              onClick={() => setView('grid')}
              aria-pressed={view === 'grid'}
            >
              <LayoutGrid size={15} /> Каталог
            </button>
          </div>
        </div>

        <div className="filters-foot">
          <span>
            найдено: <b>{total}</b> {pluralize(total, 'привычка', 'привычки', 'привычек')}
            {hasFilters ? ' · фильтры активны' : ''}
          </span>
          {hasFilters ? (
            <button type="button" className="link-button" onClick={resetFilters}>
              Сбросить фильтры
            </button>
          ) : null}
        </div>
      </section>

      <StateBlock
        loading={list.loading}
        error={list.error}
        isEmpty={items.length === 0}
        onRetry={list.reload}
        skeleton={<TableSkeleton rows={6} columns={5} />}
        emptyTitle={hasFilters ? 'Ничего не найдено' : 'Привычек пока нет'}
        emptyText={
          hasFilters
            ? 'Попробуйте изменить условия поиска или сбросить фильтры.'
            : 'Создайте первую привычку, чтобы начать собирать серии и опыт.'
        }
        emptyAction={
          hasFilters ? (
            <Button variant="secondary" onClick={resetFilters}>
              Сбросить фильтры
            </Button>
          ) : (
            <Button
              icon={Plus}
              onClick={() => {
                setEditing(null)
                setFormOpen(true)
              }}
            >
              Создать привычку
            </Button>
          )
        }
      >
        {view === 'table' ? (
          <section className="panel table-panel">
            <DataTable
              caption="Список привычек пользователя"
              columns={columns}
              items={items}
              sort={sort}
              order={order}
              onSort={handleSort}
            />
            <Pagination page={page} pages={pages} total={total} limit={PAGE_SIZE} onChange={setPage} />
          </section>
        ) : (
          <>
            <section className="catalog-grid" aria-label="Каталог привычек">
              {items.map((habit) => (
                <HabitTile
                  key={habit.id}
                  habit={habit}
                  onToggle={toggle}
                  busy={busyId === habit.id}
                  onEdit={(target) => {
                    setEditing(target)
                    setFormOpen(true)
                  }}
                  onDelete={setRemoving}
                />
              ))}
            </section>
            <Pagination page={page} pages={pages} total={total} limit={PAGE_SIZE} onChange={setPage} />
          </>
        )}
      </StateBlock>

      {/* Создание и редактирование */}
      <HabitForm
        open={formOpen}
        habit={editing}
        categories={categories}
        saving={saving}
        onSubmit={handleSubmit}
        onClose={() => {
          setFormOpen(false)
          setEditing(null)
        }}
      />

      {/* Подтверждение удаления */}
      <Modal
        open={Boolean(removing)}
        caption="УДАЛЕНИЕ"
        title="Удалить привычку?"
        onClose={() => setRemoving(null)}
      >
        <p className="modal-text">
          Привычка «{removing?.name}» будет удалена вместе со всей историей выполнения.
          Действие нельзя отменить.
        </p>
        <div className="modal-actions">
          <Button variant="secondary" onClick={() => setRemoving(null)}>
            Отмена
          </Button>
          <Button variant="danger" icon={Trash2} loading={deleting} onClick={confirmDelete}>
            Удалить
          </Button>
        </div>
      </Modal>
    </>
  )
}
