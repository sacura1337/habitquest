import { BookOpen, Droplets, Dumbbell, Leaf, Check } from 'lucide-react'

// Иконка зависит от вида привычки; карточка сообщает состояние кнопки скринридеру.
const icons = {book:BookOpen,water:Droplets,sport:Dumbbell,leaf:Leaf}
export default function HabitCard({habit,onToggle}) {
  const Icon = icons[habit.icon] || Leaf
  return <article className={`habit-card ${habit.done?'done':''}`}><div className={`habit-icon ${habit.color}`}><Icon size={20}/></div><div className="habit-info"><b>{habit.title}</b><small>{habit.category} <i/> {habit.time}</small></div><span className="xp-badge">+{habit.xp} XP</span><button className={`check ${habit.done?'checked':''}`} onClick={onToggle} aria-pressed={habit.done} aria-label={habit.done?'Снять отметку':'Отметить выполненной'}>{habit.done&&<Check size={16}/>}</button></article>
}