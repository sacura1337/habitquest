/**
 * Поле формы с подписью и сообщением об ошибке.
 *
 * Один компонент закрывает все случаи: текстовое поле, список, многострочный
 * текст и поле выбора файла. Ошибка приходит из функции проверки
 * (utils/validation.js) либо из ответа сервера, а связь «поле — сообщение»
 * задаётся через aria-describedby и aria-invalid.
 */

export default function Field({
  as = 'input',
  label,
  name,
  error,
  hint,
  options = [],
  children,
  className = '',
  ...rest
}) {
  const controlId = `field-${name}`
  const describedBy = error ? `${controlId}-error` : hint ? `${controlId}-hint` : undefined

  const common = {
    id: controlId,
    name,
    'aria-invalid': Boolean(error),
    'aria-describedby': describedBy,
    className: `field-control ${error ? 'has-error' : ''} ${className}`.trim(),
    ...rest,
  }

  return (
    <div className={`field ${error ? 'field-invalid' : ''}`}>
      {label ? (
        <label htmlFor={controlId}>
          {label}
          {rest.required ? <span className="field-required"> *</span> : null}
        </label>
      ) : null}

      {as === 'select' ? (
        <select {...common}>
          {options.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      ) : as === 'textarea' ? (
        <textarea {...common} rows={rest.rows ?? 3} />
      ) : (
        <input {...common} />
      )}

      {error ? (
        <p className="field-error" id={`${controlId}-error`}>
          {error}
        </p>
      ) : hint ? (
        <p className="field-hint" id={`${controlId}-hint`}>
          {hint}
        </p>
      ) : null}

      {children}
    </div>
  )
}
