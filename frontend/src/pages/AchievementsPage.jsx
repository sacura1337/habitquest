/**
 * Раздел «Достижения».
 *
 * Сервер сам решает, какие достижения открыты, и отдаёт прогресс
 * (current / target / percent). Фильтр переключает показ всех, только
 * полученных или только закрытых награда.
 */

import { useCallback, useMemo, useState } from 'react'
import { Award, Lock, Sparkles, Trophy } from 'lucide-react'
import StateBlock from '../components/ui/StateBlock.jsx'
import Reveal from '../components/ui/Reveal.jsx'
import { TableSkeleton } from '../components/ui/Skeleton.jsx'
import { achievements as achievementsApi } from '../api/index.js'
import { useFetch } from '../hooks/useFetch.js'
import { formatDate, formatNumber } from '../utils/format.js'

const FILTERS = [
  { value: 'all', label: 'Все' },
  { value: 'unlocked', label: 'Полученные' },
  { value: 'locked', label: 'Закрытые' },
]

export default function AchievementsPage() {
  const [filter, setFilter] = useState('all')

  const loadAchievements = useCallback(() => achievementsApi.list(), [])
  const list = useFetch(loadAchievements, [])

  const items = list.data ?? []
  const unlockedCount = items.filter((item) => item.unlocked).length

  const visible = useMemo(() => {
    if (filter === 'unlocked') return items.filter((item) => item.unlocked)
    if (filter === 'locked') return items.filter((item) => !item.unlocked)
    return items
  }, [items, filter])

  return (
    <>
      <section className="welcome">
        <div>
          <p className="date">HabitQuest / Достижения</p>
          <h1>Коллекция достижений</h1>
          <p className="sub">
            Каждый маленький шаг заслуживает награды. Открыто {unlockedCount} из {items.length}.
          </p>
        </div>

        <div className="view-switch" role="group" aria-label="Фильтр достижений">
          {FILTERS.map((item) => (
            <button
              key={item.value}
              type="button"
              className={filter === item.value ? 'active' : ''}
              onClick={() => setFilter(item.value)}
              aria-pressed={filter === item.value}
            >
              {item.label}
            </button>
          ))}
        </div>
      </section>

      {items.length > 0 ? (
        <section className="panel achievements-progress">
          <div className="section-heading">
            <div>
              <h2>Прогресс коллекции</h2>
              <p>
                {formatNumber(unlockedCount)} из {formatNumber(items.length)} наград получено
              </p>
            </div>
            <Trophy size={20} className="gold" />
          </div>
          <div className="xp-track">
            <span style={{ width: `${items.length ? Math.round((unlockedCount / items.length) * 100) : 0}%` }} />
          </div>
        </section>
      ) : null}

      <StateBlock
        loading={list.loading}
        error={list.error}
        isEmpty={visible.length === 0}
        onRetry={list.reload}
        skeleton={<TableSkeleton rows={4} columns={3} />}
        emptyTitle="Здесь пока пусто"
        emptyText={
          filter === 'all'
            ? 'Список достижений загружается с сервера.'
            : 'В этой категории достижений нет — попробуйте другой фильтр.'
        }
      >
        <div className="achievement-grid">
          {visible.map((achievement, index) => (
            <Reveal
              as="article"
              className={`panel achievement-tile ${achievement.unlocked ? 'unlocked' : ''}`}
              key={achievement.id}
              delay={index * 40}
            >
              <span className="achievement-emoji">
                {achievement.unlocked ? <Award size={26} /> : <Lock size={24} />}
              </span>

              <h2>{achievement.name}</h2>
              <p>{achievement.description}</p>

              {achievement.progress ? (
                <>
                  <div className="mini-track achievement-track">
                    <span style={{ width: `${achievement.progress.percent ?? 0}%` }} />
                  </div>
                  <small className="achievement-progress-text">
                    {achievement.progress.current} из {achievement.progress.target}
                  </small>
                </>
              ) : null}

              <span className="xp-badge">
                <Sparkles size={11} /> +{achievement.xp_reward} XP
              </span>

              <small className="achievement-state">
                {achievement.unlocked
                  ? `Получено${achievement.unlocked_at ? ` ${formatDate(achievement.unlocked_at)}` : ''}`
                  : 'Пока закрыто'}
              </small>
            </Reveal>
          ))}
        </div>
      </StateBlock>
    </>
  )
}
