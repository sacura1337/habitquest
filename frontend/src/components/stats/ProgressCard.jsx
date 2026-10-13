/**
 * Карточка уровня и полосы опыта.
 *
 * Уровень и прогресс берутся из ответа сервера (GET /api/users/me/stats),
 * а не считаются в компоненте, чтобы интерфейс и бэкенд не расходились.
 */

import { ChevronRight, Crown, Sparkles } from 'lucide-react'
import { levelTitle } from '../../utils/constants.js'
import { formatNumber } from '../../utils/format.js'

export default function ProgressCard({ xp = 0, level = 1, progress }) {
  const current = progress?.current ?? 0
  const target = progress?.target ?? 100
  const percent = progress?.percent ?? 0
  const left = Math.max(target - current, 0)

  return (
    <section className="level-card">
      <div className="level-top">
        <div className="crown">
          <Crown size={23} />
        </div>
        <div>
          <small>ТВОЙ УРОВЕНЬ</small>
          <h2>{levelTitle(level)}</h2>
        </div>
        <strong className="level-number">
          <small>LVL</small>
          {level}
        </strong>
      </div>

      <div className="xp-label">
        <span>Опыт до следующего уровня</span>
        <b>
          {formatNumber(xp)} / {formatNumber(current + left)} XP
        </b>
      </div>

      <div className="xp-track">
        <span style={{ width: `${percent}%` }} />
      </div>

      <div className="level-foot">
        <span>
          <Sparkles size={14} /> Ещё {formatNumber(left)} XP до уровня {level + 1}
        </span>
        <ChevronRight size={18} />
      </div>
    </section>
  )
}
