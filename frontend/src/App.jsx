import { useEffect, useState } from 'react'
import { Activity, Award, CalendarDays, Check, Flame, Plus, Sparkles, Target, Trophy, X } from 'lucide-react'
import Header from './components/Header.jsx'
import Sidebar from './components/Sidebar.jsx'
import StatCard from './components/StatCard.jsx'
import ProgressCard from './components/ProgressCard.jsx'
import HabitCard from './components/HabitCard.jsx'

// Демо-данные для макета. На следующем этапе их можно будет заменить ответом API.
const starterHabits = [
  {id:1,title:'Читать 20 минут',category:'Обучение',icon:'book',color:'violet',xp:20,done:true,time:'Утро'},
  {id:2,title:'Выпить 8 стаканов воды',category:'Здоровье',icon:'water',color:'blue',xp:10,done:false,time:'В течение дня'},
  {id:3,title:'Тренировка',category:'Спорт',icon:'sport',color:'orange',xp:30,done:false,time:'Вечер'},
]
export default function App() {
  // Сохраняем выбор темы в браузере между перезагрузками.
  const [theme,setTheme] = useState(()=>localStorage.getItem('habitquest-theme')||'light')
  const [habits,setHabits] = useState(starterHabits)
  const [active,setActive] = useState('Главная')
  const [mobileOpen,setMobileOpen] = useState(false)
  const [formOpen,setFormOpen] = useState(false)
  const [newTitle,setNewTitle] = useState('')
  const [notice,setNotice] = useState('')
  useEffect(()=>{document.documentElement.dataset.theme=theme;localStorage.setItem('habitquest-theme',theme)},[theme])
  const completed = habits.filter(h=>h.done).length
  const xp = 680 + habits.filter(h=>h.done).reduce((sum,h)=>sum+h.xp,0)
  const progress = Math.min(xp/800*100,100)
  const today = new Intl.DateTimeFormat('ru-RU',{weekday:'long',day:'numeric',month:'long'}).format(new Date())

  // Отметка привычки обновляет интерфейс. Данные демонстрационные и не отправляются на сервер.
  function toggle(id){setHabits(old=>old.map(h=>h.id===id?{...h,done:!h.done}:h))}
  // Новая привычка добавляется в локальное состояние.
  function addHabit(e){e.preventDefault();const title=newTitle.trim();if(!title)return;setHabits(old=>[...old,{id:Date.now(),title,category:'Моё',icon:'leaf',color:'green',xp:10,done:false,time:'Без напоминания'}]);setNewTitle('');setFormOpen(false);setNotice('Привычка добавлена');setTimeout(()=>setNotice(''),2400)}

  return <div className="app-shell">
    <Sidebar active={active} setActive={setActive} mobileOpen={mobileOpen} close={()=>setMobileOpen(false)}/>
    <main className="main-area">
      <Header theme={theme} onToggleTheme={()=>setTheme(t=>t==='light'?'dark':'light')} onOpenMenu={()=>setMobileOpen(true)}/>
      <div className="page-content">
        {active !== 'Главная' ? <section className="inner-page">
          <div className="welcome"><div><p className="date">HabitQuest / {active}</p><h1>{active === 'Привычки' ? 'Мои привычки' : active === 'Статистика' ? 'Твой прогресс' : active === 'Достижения' ? 'Коллекция достижений' : active === 'Профиль' ? 'Мой профиль' : 'Настройки'}</h1><p className="sub">{active === 'Привычки' ? 'Управляй ежедневными действиями и формируй устойчивые привычки.' : active === 'Статистика' ? 'Отслеживай результаты и замечай, как меняется твоя регулярность.' : active === 'Достижения' ? 'Каждый маленький шаг заслуживает награды.' : active === 'Профиль' ? 'Твоя история, уровень и личные результаты.' : 'Настрой HabitQuest под себя.'}</p></div>{active === 'Привычки' && <button className="primary-button" onClick={()=>setFormOpen(true)}><Plus size={18}/> Новая привычка</button>}</div>
          {active === 'Привычки' && <section className="panel"><div className="section-heading"><div><h2>Все привычки</h2><p>{habits.length} активных привычек · сегодня выполнено {completed}</p></div></div><div className="habit-list">{habits.map(h=><HabitCard key={h.id} habit={h} onToggle={()=>toggle(h.id)}/>)}</div><button className="add-row" onClick={()=>setFormOpen(true)}><span><Plus size={18}/></span>Добавить новую привычку</button></section>}
          {active === 'Статистика' && <><section className="stats-grid"><StatCard Icon={Target} label="Выполнено за неделю" value="24" suffix="раза" tone="purple" note="+18% к прошлой неделе"/><StatCard Icon={Flame} label="Текущая серия" value="7" suffix="дней" tone="orange" note="Лучшая серия — 12 дней"/><StatCard Icon={Activity} label="Успешность" value="86" suffix="%" tone="green" note="За последние 30 дней"/><StatCard Icon={Sparkles} label="Получено опыта" value={xp.toLocaleString('ru-RU')} suffix="XP" tone="blue" note="Ты на верном пути"/></section><section className="panel progress-panel"><div className="section-heading"><div><h2>Активность за неделю</h2><p>Количество выполненных привычек по дням</p></div></div><div className="chart-summary"><span><i/>Выполнено привычек</span><b>24 <small>за неделю</small></b></div><div className="chart big-chart">{[3,4,2,5,3,4,3].map((n,i)=><div className="bar-col" key={i}><div className={`bar ${i===3?'highlight':''}`} style={{height:`${n*23}px`}}/><small>{['Пн','Вт','Ср','Чт','Пт','Сб','Вс'][i]}</small></div>)}</div><div className="chart-foot"><span><Activity size={14}/> +18%</span> по сравнению с прошлой неделей</div></section><section className="panel"><h2>Самые стабильные привычки</h2><div className="habit-list">{habits.map(h=><HabitCard key={h.id} habit={h} onToggle={()=>toggle(h.id)}/>)}</div></section></>}
          {active === 'Достижения' && <div className="achievement-grid">{[{icon:'🏁',title:'Первые шаги',desc:'Выполни первую привычку',xp:'+25 XP',done:true},{icon:'🔥',title:'Стабильность',desc:'7 дней подряд',xp:'+50 XP',done:true},{icon:'📚',title:'Книжный червь',desc:'Прочитай 10 раз',xp:'+75 XP',done:true},{icon:'⚡',title:'На подъёме',desc:'Достигни 5 уровня',xp:'+100 XP',done:false},{icon:'🎯',title:'Сила привычки',desc:'50 выполнений',xp:'+100 XP',done:false},{icon:'🌟',title:'Месяц силы',desc:'30 дней подряд',xp:'+150 XP',done:false}].map(a=><article className={`panel achievement-tile ${a.done?'unlocked':''}`} key={a.title}><span className="achievement-emoji">{a.icon}</span><h2>{a.title}</h2><p>{a.desc}</p><span className="xp-badge">{a.xp}</span><small>{a.done?'Получено':'Пока закрыто'}</small></article>)}</div>}
          {active === 'Профиль' && <section className="panel profile-panel"><div className="profile-avatar">А</div><h2>Александр</h2><p className="sub">Исследователь привычек с 2026 года</p><div className="profile-metrics"><div><b>{xp}</b><small>Всего XP</small></div><div><b>7 дней</b><small>Текущая серия</small></div><div><b>12</b><small>Достижений</small></div></div><h2>О себе</h2><p className="sub">Каждый день становлюсь немного лучше. Моя цель — регулярность, а не идеальность.</p><button className="secondary-button" onClick={()=>setNotice('Редактирование профиля доступно в следующем этапе')}>Редактировать профиль</button></section>}
          {active === 'Настройки' && <section className="panel settings-list"><div><div><h2>Внешний вид</h2><p className="sub">Выбери удобную тему интерфейса.</p></div><button className="secondary-button" onClick={()=>setTheme(t=>t==='light'?'dark':'light')}>Тема: {theme === 'light' ? 'Светлая' : 'Тёмная'}</button></div><div><div><h2>Напоминания</h2><p className="sub">Демо-настройка уведомлений о привычках.</p></div><button className="secondary-button" onClick={()=>setNotice('Настройка напоминаний сохранена')}>Включить напоминания</button></div><div><div><h2>Данные приложения</h2><p className="sub">Сейчас данные демонстрационные и хранятся только в состоянии интерфейса.</p></div><span className="xp-badge">Демо-режим</span></div></section>}
        </section> : <>
        <section className="welcome"><div><p className="date">{today}</p><h1>Доброе утро, Алекс! <span>✦</span></h1><p className="sub">Маленькие шаги каждый день приводят к большим результатам.</p></div><button className="primary-button" onClick={()=>setFormOpen(true)}><Plus size={18}/> Новая привычка</button></section>
        <section className="stats-grid" aria-label="Ключевые показатели">
          <StatCard Icon={Sparkles} label="Всего опыта" value={xp.toLocaleString('ru-RU')} suffix="XP" tone="purple" note="+40 XP за сегодня"/>
          <StatCard Icon={Flame} label="Серия дней" value="7" suffix="дней" tone="orange" note="Лучшая серия: 12 дней"/>
          <StatCard Icon={Target} label="Сегодня выполнено" value={`${completed}/${habits.length}`} suffix="привычек" tone="green" note="Продолжай в том же духе!"/>
          <StatCard Icon={Trophy} label="Достижения" value="12" suffix="/ 20" tone="blue" note="Ещё 8 до коллекции"/>
        </section>
        <section className="dashboard-grid">
          <div className="left-column">
            <ProgressCard xp={xp} progress={progress}/>
            <section className="panel">
              <div className="section-heading"><div><h2>Твои привычки</h2><p>Выполняй привычки и получай опыт</p></div><button className="link-button" onClick={()=>setActive('Привычки')}>Все привычки →</button></div>
              <div className="habit-list">{habits.map(h=><HabitCard key={h.id} habit={h} onToggle={()=>toggle(h.id)}/>)}</div>
              <button className="add-row" onClick={()=>setFormOpen(true)}><span><Plus size={18}/></span>Добавить новую привычку</button>
            </section>
          </div>
          <div className="right-column">
            <section className="panel progress-panel"><div className="section-heading"><div><h2>Твой прогресс</h2><p>Активность за неделю</p></div><button className="icon-button" aria-label="Выбрать период"><CalendarDays size={17}/></button></div>
              <div className="chart-summary"><span><i/>Выполнено привычек</span><b>24 <small>за неделю</small></b></div>
              <div className="chart" role="img" aria-label="График выполненных привычек за неделю">{[3,4,2,5,3,4,3].map((n,i)=><div className="bar-col" key={i}><div className={`bar ${i===3?'highlight':''}`} style={{height:`${n*17}px`}}/><small>{['Пн','Вт','Ср','Чт','Пт','Сб','Вс'][i]}</small></div>)}</div>
              <div className="chart-foot"><span><Activity size={14}/> +18%</span> по сравнению с прошлой неделей</div>
            </section>
            <section className="challenge"><div className="challenge-icon"><Sparkles size={22}/></div><div className="challenge-body"><small>ЗАДАНИЕ НЕДЕЛИ</small><h3>Неделя без пропусков</h3><p>Выполняй хотя бы 2 привычки каждый день.</p><div className="challenge-track"><span/></div><div className="challenge-foot"><span>5 из 7 дней</span><b>+100 XP</b></div></div></section>
            <section className="panel achievement"><div className="section-heading"><div><h2>Недавнее достижение</h2><p>Ты на верном пути!</p></div><Award size={21} className="gold"/></div><div className="achievement-row"><span className="medal"><Flame size={23}/></span><div><b>Стабильность</b><small>7 дней подряд</small></div><span className="xp-badge gold-badge">+50 XP</span></div></section>
          </div>
        </section>
        <footer className="footer"><span>© 2026 HabitQuest</span><span>Создавай привычки. Прокачивай себя. ✦</span></footer>
        </>}
      </div>
    </main>
    {formOpen&&<div className="modal-backdrop" onMouseDown={e=>{if(e.target===e.currentTarget)setFormOpen(false)}}><section className="modal" role="dialog" aria-modal="true" aria-labelledby="modal-title"><div className="modal-head"><div><small>НОВАЯ ЦЕЛЬ</small><h2 id="modal-title">Создать привычку</h2></div><button className="icon-button" aria-label="Закрыть" onClick={()=>setFormOpen(false)}><X size={18}/></button></div><form onSubmit={addHabit}><label htmlFor="habit-title">Название привычки</label><input id="habit-title" autoFocus maxLength={60} placeholder="Например, гулять 20 минут" value={newTitle} onChange={e=>setNewTitle(e.target.value)}/><p className="hint">Новая привычка будет добавлена с наградой 10 XP.</p><div className="modal-actions"><button type="button" className="secondary-button" onClick={()=>setFormOpen(false)}>Отмена</button><button className="primary-button" type="submit"><Plus size={16}/> Создать привычку</button></div></form></section></div>}
    {notice&&<div className="toast" role="status"><Check size={17}/>{notice}</div>}
  </div>
}