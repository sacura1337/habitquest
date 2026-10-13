/**
 * Карточка показателя на главной странице и в статистике.
 *
 * Значения приходят с сервера, поэтому компонент только оформляет их.
 */

export default function StatCard({ icon: Icon, label, value, suffix, note, tone = 'purple' }) {
  return (
    <article className="stat-card">
      <div className={`stat-icon ${tone}`}>
        <Icon size={20} />
      </div>
      <p>{label}</p>
      <div className="stat-value">
        {value}
        {suffix ? <small>{suffix}</small> : null}
      </div>
      {note ? <div className="stat-note">{note}</div> : null}
    </article>
  )
}
