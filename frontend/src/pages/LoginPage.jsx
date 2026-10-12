/**
 * Страница входа (задание 6).
 *
 * После успешного входа пользователь возвращается на тот адрес, с которого
 * его перенаправила защита маршрутов, либо попадает в кабинет.
 * Данные проверяются в браузере, затем повторно на сервере.
 */

import { useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { LogIn, TriangleAlert } from 'lucide-react'
import AuthShell from '../components/layout/AuthShell.jsx'
import Field from '../components/ui/Field.jsx'
import Button from '../components/ui/Button.jsx'
import { useAuth } from '../context/AuthContext.jsx'
import { useToast } from '../context/ToastContext.jsx'
import { hasErrors, validateLogin } from '../utils/validation.js'

/** Тестовый аккаунт из seed-скрипта бэкенда — указан в отчёте. */
const DEMO_ACCOUNT = { email: 'demo@habitquest.ru', password: 'demo1234' }

export default function LoginPage() {
  const { login } = useAuth()
  const { notify } = useToast()
  const navigate = useNavigate()
  const location = useLocation()

  const [values, setValues] = useState({ email: '', password: '' })
  const [errors, setErrors] = useState({})
  const [serverError, setServerError] = useState('')
  const [loading, setLoading] = useState(false)

  const redirectTo = location.state?.from ?? '/app'

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

    const found = validateLogin(values)
    setErrors(found)
    if (hasErrors(found)) return

    setLoading(true)
    setServerError('')
    try {
      await login({ email: values.email.trim(), password: values.password })
      notify('Вы вошли в систему')
      navigate(redirectTo, { replace: true })
    } catch (error) {
      setServerError(error.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <AuthShell
      title="Вход в HabitQuest"
      subtitle="Введите данные аккаунта, чтобы продолжить работу с привычками."
      footer={
        <>
          Ещё нет аккаунта? <Link to="/register">Зарегистрироваться</Link>
        </>
      }
    >
      <form onSubmit={handleSubmit} noValidate>
        <Field
          label="Адрес электронной почты"
          name="email"
          type="email"
          required
          autoComplete="email"
          placeholder="demo@habitquest.ru"
          value={values.email}
          onChange={update('email')}
          error={errors.email}
        />

        <Field
          label="Пароль"
          name="password"
          type="password"
          required
          autoComplete="current-password"
          placeholder="Не менее 8 символов"
          value={values.password}
          onChange={update('password')}
          error={errors.password}
        />

        {serverError ? (
          <p className="form-server-error" role="alert">
            <TriangleAlert size={15} /> {serverError}
          </p>
        ) : null}

        <Button type="submit" icon={LogIn} loading={loading} className="auth-submit">
          Войти
        </Button>

        <button
          type="button"
          className="demo-fill"
          onClick={() => {
            setValues({ ...DEMO_ACCOUNT })
            setErrors({})
          }}
        >
          Подставить тестовый аккаунт
        </button>
      </form>
    </AuthShell>
  )
}
