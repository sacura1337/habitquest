/**
 * Страница регистрации (задание 6).
 *
 * Пароль передаётся на сервер по HTTPS и сохраняется в базе только в виде
 * хеша bcrypt — в браузере пароль нигде не остаётся, кроме полей формы.
 * Повтор пароля проверяется на клиенте, остальные правила дублирует сервер.
 */

import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { TriangleAlert, UserPlus } from 'lucide-react'
import AuthShell from '../components/layout/AuthShell.jsx'
import Field from '../components/ui/Field.jsx'
import Button from '../components/ui/Button.jsx'
import { useAuth } from '../context/AuthContext.jsx'
import { useToast } from '../context/ToastContext.jsx'
import { hasErrors, validateRegister } from '../utils/validation.js'

const EMPTY = { username: '', email: '', password: '', passwordConfirm: '' }

export default function RegisterPage() {
  const { register } = useAuth()
  const { notify } = useToast()
  const navigate = useNavigate()

  const [values, setValues] = useState(EMPTY)
  const [errors, setErrors] = useState({})
  const [serverError, setServerError] = useState('')
  const [loading, setLoading] = useState(false)

  function update(field) {
    return (event) => {
      setValues((previous) => ({ ...previous, [field]: event.target.value }))
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

    const found = validateRegister(values)
    setErrors(found)
    if (hasErrors(found)) return

    setLoading(true)
    setServerError('')
    try {
      await register({
        username: values.username.trim(),
        email: values.email.trim(),
        password: values.password,
      })
      notify('Аккаунт создан. Добро пожаловать в HabitQuest!')
      navigate('/app', { replace: true })
    } catch (error) {
      setServerError(error.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <AuthShell
      title="Создание аккаунта"
      subtitle="Заведите аккаунт за минуту и начните собирать серии выполнения."
      footer={
        <>
          Уже есть аккаунт? <Link to="/login">Войти</Link>
        </>
      }
    >
      <form onSubmit={handleSubmit} noValidate>
        <Field
          label="Имя"
          name="username"
          required
          maxLength={50}
          autoComplete="name"
          placeholder="Как к вам обращаться"
          value={values.username}
          onChange={update('username')}
          error={errors.username}
        />

        <Field
          label="Адрес электронной почты"
          name="email"
          type="email"
          required
          autoComplete="email"
          placeholder="you@example.com"
          value={values.email}
          onChange={update('email')}
          error={errors.email}
        />

        <Field
          label="Пароль"
          name="password"
          type="password"
          required
          minLength={8}
          maxLength={72}
          autoComplete="new-password"
          placeholder="Не менее 8 символов"
          value={values.password}
          onChange={update('password')}
          error={errors.password}
          hint="Пароль хранится в базе данных только в виде хеша"
        />

        <Field
          label="Повтор пароля"
          name="passwordConfirm"
          type="password"
          required
          autoComplete="new-password"
          placeholder="Введите пароль ещё раз"
          value={values.passwordConfirm}
          onChange={update('passwordConfirm')}
          error={errors.passwordConfirm}
        />

        {serverError ? (
          <p className="form-server-error" role="alert">
            <TriangleAlert size={15} /> {serverError}
          </p>
        ) : null}

        <Button type="submit" icon={UserPlus} loading={loading} className="auth-submit">
          Зарегистрироваться
        </Button>
      </form>
    </AuthShell>
  )
}
