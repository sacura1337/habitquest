// Универсальная карточка показателя: иконка и данные приходят через props.
export default function StatCard({Icon,label,value,suffix,note,tone}) {
  return <article className="stat-card"><div className={`stat-icon ${tone}`}><Icon size={20}/></div><p>{label}</p><div className="stat-value">{value}<small>{suffix}</small></div><div className="stat-note">{note}</div></article>
}