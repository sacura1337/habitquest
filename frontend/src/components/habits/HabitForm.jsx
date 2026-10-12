/**
 * Форма создания и редактирования привычки (задание 6).
 *
 * Данные проверяются дважды: сначала в браузере (utils/validation.js),
 * затем сервером. Если сервер вернул ошибки валидации, они раскладываются
 * по полям формы и показываются рядом с ними.
 */

import { useEffect, useState } from 'react'
import { Save } from 'lucide-react'
import Modal from '../ui/Modal.jsx'
import Field from '../ui/Field.jsx'
import Button from '../ui/Button.jsx'
import { DIFFICULTIES, FREQUENCIES } from '../../utils/constants.js'
import { hasErrors, validateHabit } from '../../utils/validation.js'

/** Значения формы по умолчанию: пустая привычка или данные существующей. */
function initialValues(habit) {
  return {
    name: habit?.name ?? '',
    description: habit?.description ?? '',
    category_id: habit?.category?.id ?? habit?.category_id ?? '',
    difficulty: habit?.difficulty ?? 'easy',
    frequency: habit?.frequency ?? 'daily',
    reminder_time: habit?.reminder_time ? String(habit.reminder_time).slice(0, 5) : '',
    is_active: habit?.is_active ?? true,
  }
}

export default function HabitForm({ open, habit, categories = [], saving = false, onSubmit, onClose }) {
  const [values, setValues] = useState(() => initialValues(habit))
  const [errors, setErrors] = useState({})
  const [serverError, setServerError] = useState('')

  // При открытии окна форма заполняется данными той привычки, которую правят.
  useEffect(() => {
    if (!open) return
    setValues(initialValues(habit))
    setErrors({})
    setServerError('')
  }, [open, habit])

  function update(field) {
    return (event) => {
      const target = event.target
      const value = target.type === 'checkbox' ? target.checked : target.value
      setValues((previous) => ({ ...previous, [field]: value }))
      setErrors((previous) => {
        if (!(field in previous)) return previous
        const next = { ...previous }
        delete next[field]
        return next
      })
    }
  }

  async function handleSubmit(event) {
    event.preventDefault()

    const found = validateHabit(values)
    setErrors(found)
    if (hasErrors(found)) return

    const payload = {
      name: values.name.trim(),
      description: values.description.trim() || null,
      category_id: Number(values.category_id),
      difficulty: values.difficulty,
      frequency: values.frequency,
      reminder_time: values.reminder_time || null,
      is_active: values.is_active,
    }

    try {
      setServerError('')
      await onSubmit(payload)
    } catch (error) {
      setServerError(error.message)

      // Ошибки валидации FastAPI приходят списком с указанием поля.
      if (Array.isArray(error.details?.detail)) {
        const mapped = {}
        error.details.detail.forEach((item) => {
          const field = item.loc?.[item.loc.length - 1]
          if (field) mapped[field] = item.msg
        })
        setErrors(mapped)
      }
    }
  }

  const categoryOptions = [
    { value: '', label: 'Выберите категорию' },
    ...categories.map((category) => ({ value: category.id, label: category.name })),
  ]

  return (
    <Modal
      open={open}
      caption={habit ? 'РЕДАКТИРОВАНИЕ' : 'НОВАЯ ЦЕЛЬ'}
      title={habit ? 'Изменить привычку' : 'Создать привычку'}
      onClose={onClose}
    >
      <form onSubmit={handleSubmit} noValidate>
        <Field
          label="Название привычки"
          name="name"
          required
          maxLength={100}
          placeholder="Например, гулять 20 минут"
          value={values.name}
          onChange={update('name')}
          error={errors.name}
          autoFocus
        />

        <Field
          as="textarea"
          label="Описание"
          name="description"
          rows={3}
          maxLength={500}
          placeholder="Зачем вам эта привычка"
          value={values.description}
          onChange={update('description')}
          error={errors.description}
          hint="Необязательное поле, до 500 символов"
        />

        <div className="field-row">
          <Field
            as="select"
            label="Категория"
            name="category_id"
            required
            options={categoryOptions}
            value={values.category_id}
            onChange={update('category_id')}
            error={errors.category_id}
          />

          <Field
            as="select"
            label="Сложность"
            name="difficulty"
            options={DIFFICULTIES.map((item) => ({
              value: item.value,
              label: `${item.label} · +${item.xp} XP`,
            }))}
            value={values.difficulty}
            onChange={update('difficulty')}
          />
        </div>

        <div className="field-row">
          <Field
            as="select"
            label="Частота"
            name="frequency"
            options={FREQUENCIES}
            value={values.frequency}
            onChange={update('frequency')}
          />

          <Field
            label="Время напоминания"
            name="reminder_time"
            type="time"
            value={values.reminder_time}
            onChange={update('reminder_time')}
            error={errors.reminder_time}
            hint="Необязательно"
          />
        </div>

        <label className="checkbox-row" htmlFor="field-is_active">
          <input
            id="field-is_active"
            name="is_active"
            type="checkbox"
            checked={values.is_active}
            onChange={update('is_active')}
          />
          Привычка активна
        </label>

        {serverError ? (
          <p className="form-server-error" role="alert">
            {serverError}
          </p>
        ) : null}

        <div className="modal-actions">
          <Button variant="secondary" onClick={onClose}>
            Отмена
          </Button>
          <Button type="submit" icon={Save} loading={saving}>
            {habit ? 'Сохранить изменения' : 'Создать привычку'}
          </Button>
        </div>
      </form>
    </Modal>
  )
}
