/**
 * Главная страница кабинета.
 *
 * Все данные приходят с сервера: сводная статистика профиля, сводка за день,
 * точки графика, привычки для слайдера и списка, последнее достижение.
 * Демонстрационных массивов в коде больше нет.
 */

import { useCallback } from 'react'
import { Link, useOutletContext } from 'react-router-dom'
import { Award, Flame, Plus, Sparkles, Target, Trophy } from 'lucide-react'
import ProgressCard from '../components/stats/ProgressCard.jsx'
import StatCard from '../components/stats/StatCard.jsx'
import WeeklyChart from '../components/stats/WeeklyChart.jsx'
import HabitCard from '../components/habits/HabitCard.jsx'
import HabitSlider from '../components/habits/HabitSlider.jsx'
import StateBlock from '../components/ui/StateBlock.jsx'
import { HabitListSkeleton, StatCardsSkeleton } from '../components/ui/Skeleton.jsx'
import Reveal from '../components/ui/Reveal.jsx'
import { achievements, habits, statistics } from '../api/index.js'
import { useAuth } from '../context/AuthContext.jsx'
import { useFetch } from '../hooks/useFetch.js'
import { useHabitToggle } from '../hooks/useHabitToggle.js'
import { formatDate, formatNumber } from '../utils/format.js'

/** Приветствие по времени суток. */
function greeting() {
  const hour = new Date().getHours()
  if (hour < 6) return 'Доброй ночи'
  if (hour < 12) return 'Доброе утро'
  if (hour < 18) return 'Добрый день'
  return 'Добрый вечер'
}

export default function DashboardPage() {
  const { user } = useAuth()
  const { stats } = useOutletContext() ?? {}

  const loadDay = useCallback(() => statistics.summary('day'), [])
  const loadProgress = useCallback(() => statistics.progress(14), [])
  const loadHabits = useCallback(() => habits.list({ limit: 5, sort: 'streak', order: 'desc' }), [])
  const loadAchievements = useCallback(() => achievements.list(), [])

  const day = useFetch(loadDay, [])
  const progress = useFetch(loadProgress, [])
  const habitList = useFetch(loadHabits, [])
  const achievementList = useFetch(loadAchievements, [])

  const reloadAll = useCallback(() => {
    day.reload()
    progress.reload()
    habitList.reload()
    achievementList.reload()
    // Функции reload из useFetch неизменны между отрисовками.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [day.reload, progress.reload, habitList.reload, achievementList.reload])

  const { toggle, busyId } = useHabitToggle(reloadAll)

  const habitItems = habitList.data?.items ?? []
  const unlocked = (achievementList.data ?? []).filter((item) => item.unlocked)
  const lastAchievement = unlocked[unlocked.length - 1]

  const level = stats?.level ?? user?.level ?? 1
  const xp = stats?.xp ?? user?.xp ?? 0

  return (
    <>
      <section className="welcome">
        <div>
          <p className="date">
            {formatDate(new Date())} · HabitQuest
          </p>
          <h1>
            {greeting()}, {user?.username ?? 'друг'} <span>✦</span>
          </h1>
          <p className="sub">Маленькие шаги каждый день приводят к большим результатам.</p>
        </div>
        <Link className="primary-button" to="/app/habits">
          <Plus size={18} /> Мои привычки
        </Link>
      </section>

      {/* Ключевые показатели */}
      {!stats ? (
        <StatCardsSkeleton />
      ) : (
        <section className="stats-grid" aria-label="Ключевые показатели">
          <StatCard
            icon={Sparkles}
            label="Всего опыта"
            value={formatNumber(xp)}
            suffix="XP"
            tone="purple"
            note={`Уровень ${level}`}
          />
          <StatCard
            icon={Flame}
            label="Лучшая серия"
            value={stats.best_streak ?? 0}
            suffix="дней"
            tone="orange"
            note="Рекорд за всё время"
          />
          <StatCard
            icon={Target}
            label="Сегодня выполнено"
            value={`${day.data?.total_completions ?? 0}/${day.data?.possible_completions ?? 0}`}
            suffix="привычек"
            tone="green"
            note={`Выполнение ${day.data?.completion_percent ?? 0}%`}
          />
          <StatCard
            icon={Trophy}
            label="Достижения"
            value={`${stats.achievements_unlocked ?? 0}`}
            suffix="открыто"
            tone="blue"
            note={`Всего привычек: ${stats.total_habits ?? 0}`}
          />
        </section>
      )}

      {/* Слайдер привычек из базы данных */}
      <Reveal className="dashboard-slider">
        <HabitSlider habits={habitItems} loading={habitList.loading} />
      </Reveal>

      <div className="dashboard-grid">
        <div className="left-column">
          <ProgressCard xp={xp} level={level} progress={stats?.level_progress} />

          <section className="panel">
            <div className="section-heading">
              <div>
                <h2>Твои привычки</h2>
                <p>Выполняй привычки и получай опыт</p>
              </div>
              <Link className="link-button" to="/app/habits">
                Все привычки →
              </Link>
            </div>

            <StateBlock
              loading={habitList.loading}
              error={habitList.error}
              isEmpty={habitItems.length === 0}
              onRetry={habitList.reload}
              skeleton={<HabitListSkeleton rows={3} />}
              emptyTitle="Привычек пока нет"
              emptyText="Создайте первую привычку — и она появится здесь."
              emptyAction={
                <Link className="primary-button" to="/app/habits">
                  <Plus size={16} /> Перейти к привычкам
                </Link>
              }
            >
              <div className="habit-list">
                {habitItems.map((habit) => (
                  <HabitCard
                    key={habit.id}
                    habit={habit}
                    onToggle={toggle}
                    busy={busyId === habit.id}
                  />
                ))}
              </div>
            </StateBlock>
          </section>
        </div>

        <div className="right-column">
          <StateBlock
            loading={progress.loading}
            error={progress.error}
            isEmpty={false}
            onRetry={progress.reload}
          >
            <WeeklyChart
              points={progress.data ?? []}
              title="Твой прогресс"
              subtitle="Выполнение за последние две недели"
            />
          </StateBlock>

          <section className="panel achievement">
            <div className="section-heading">
              <div>
                <h2>Недавнее достижение</h2>
                <p>
                  {unlocked.length > 0
                    ? `Открыто ${unlocked.length} из ${achievementList.data?.length ?? 0}`
                    : 'Пока ничего не открыто'}
                </p>
              </div>
              <Award size={21} className="gold" />
            </div>

            {lastAchievement ? (
              <div className="achievement-row">
                <span className="medal">
                  <Award size={23} />
                </span>
                <div>
                  <b>{lastAchievement.name}</b>
                  <small>{lastAchievement.description}</small>
                </div>
                <span className="xp-badge gold-badge">+{lastAchievement.xp_reward} XP</span>
              </div>
            ) : (
              <p className="sub">
                Отмечайте выполнение привычек — достижения открываются автоматически.
              </p>
            )}

            <Link className="link-button achievement-link" to="/app/achievements">
              Все достижения →
            </Link>
          </section>
        </div>
      </div>
    </>
  )
}
