import { Crown, Sparkles, ChevronRight } from 'lucide-react'

// Карточка уровня и полосы опыта.
export default function ProgressCard({xp,progress}) {
  return <section className="level-card"><div className="level-top"><div className="crown"><Crown size={23}/></div><div><small>ТВОЙ УРОВЕНЬ</small><h2>Создатель привычек</h2></div><strong className="level-number"><small>LVL</small>5</strong></div><div className="xp-label"><span>Опыт до следующего уровня</span><b>{xp} / 800 XP</b></div><div className="xp-track"><span style={{width:`${progress}%`}}/></div><div className="level-foot"><span><Sparkles size={14}/> Ещё {Math.max(800-xp,0)} XP до уровня 6</span><ChevronRight size={18}/></div></section>
}