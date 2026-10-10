import { Award, BarChart3, CircleHelp, Home, Settings, Target, Trophy, UserRound, X } from 'lucide-react'

// Боковая навигация — отдельный компонент, чтобы использовать её и на других страницах.
const links = [{name:'Главная',Icon:Home},{name:'Привычки',Icon:Target},{name:'Статистика',Icon:BarChart3},{name:'Достижения',Icon:Trophy}]
export default function Sidebar({active, setActive, mobileOpen, close}) {
  return <>
    {mobileOpen && <button className="scrim" aria-label="Закрыть меню" onClick={close}/>}
    <aside className={`sidebar ${mobileOpen?'sidebar-open':''}`}>
      <div className="brand"><span className="brand-mark">✦</span><span>Habit<span className="accent">Quest</span></span><button className="icon-button close-menu" aria-label="Закрыть" onClick={close}><X size={18}/></button></div>
      <p className="nav-caption">МЕНЮ</p>
      <nav>{links.map(({name,Icon})=><button key={name} onClick={()=>{setActive(name);close()}} className={`nav-link ${active===name?'active':''}`}><Icon size={18}/>{name}{name==='Достижения'&&<span className="count">3</span>}</button>)}</nav>
      <hr/><p className="nav-caption">ЛИЧНОЕ</p>
      <button className={`nav-link ${active==='Профиль'?'active':''}`} onClick={()=>{setActive('Профиль');close()}}><UserRound size={18}/>Мой профиль</button>
      <button className={`nav-link ${active==='Настройки'?'active':''}`} onClick={()=>{setActive('Настройки');close()}}><Settings size={18}/>Настройки</button>
      <div className="side-bottom"><span className="leaf">✦</span><b>Каждый день — шаг вперёд</b><p>Ты уже сделал больше, чем вчера. Продолжай!</p><div className="mini-track"><span/></div><small>7 дней подряд 🔥</small><a href="#help"><CircleHelp size={15}/> Помощь и поддержка</a></div>
      <small className="version">HABITQUEST <span>v1.0</span></small>
    </aside>
  </>
}