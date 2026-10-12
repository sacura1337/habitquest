/**
 * Раздел «Профиль» (задание 6 — загрузка изображения через форму).
 *
 * Аватар отправляется на сервер методом multipart/form-data, файл сохраняется
 * в каталоге uploads и отдаётся по адресу /uploads/<имя>. Перед отправкой
 * файл проверяется в браузере: тип и размер.
 */

import { useCallback, useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Camera, Flame, LogOut, Save, Sparkles, Target, Trash2, Trophy, Upload } from 'lucide-react'
import StateBlock from '../components/ui/StateBlock.jsx'
import Field from '../components/ui/Field.jsx'
import Button from '../components/ui/Button.jsx'
import StatCard from '../components/stats/StatCard.jsx'
import { StatCardsSkeleton } from '../components/ui/Skeleton.jsx'
import { auth as authApi, users as usersApi } from '../api/index.js'
import { resolveAssetUrl } from '../api/client.js'
import { useAuth } from '../context/AuthContext.jsx'
import { useToast } from '../context/ToastContext.jsx'
import { useFetch } from '../hooks/useFetch.js'
import { formatFullDate, formatNumber, initialOf } from '../utils/format.js'
import { levelTitle } from '../utils/constants.js'
import { hasErrors, validateImage, validateProfile } from '../utils/validation.js'

export default function ProfilePage() {
  const { user, applyUser, logout } = useAuth()
  const { notify } = useToast()
  const navigate = useNavigate()
  const fileInput = useRef(null)

  const [username, setUsername] = useState(user?.username ?? '')
  const [errors, setErrors] = useState({})
  const [saving, setSaving] = useState(false)
  const [uploading, setUploading] = useState(false)

  useEffect(() => {
    setUsername(user?.username ?? '')
  }, [user?.username])

  const loadStats = useCallback(() => usersApi.stats(), [])
  const stats = useFetch(loadStats, [user?.id], { enabled: Boolean(user) })

  /** Сохранение имени. */
  async function handleSaveName(event) {
    event.preventDefault()

    const found = validateProfile({ username })
    setErrors(found)
    if (hasErrors(found)) return

    setSaving(true)
    try {
      const updated = await usersApi.update({ username: username.trim() })
      applyUser(updated)
      notify('Имя обновлено')
    } catch (error) {
      notify(error.message, 'error')
    } finally {
      setSaving(false)
    }
  }

  /** Загрузка аватара: сначала проверка файла, затем отправка на сервер. */
  async function handleAvatar(event) {
    const file = event.target.files?.[0]
    event.target.value = ''
    if (!file) return

    const problem = validateImage(file)
    if (problem) {
      notify(problem, 'error')
      return
    }

    setUploading(true)
    try {
      const updated = await usersApi.uploadAvatar(file)
      // Сервер может вернуть обновлённого пользователя либо только ссылку.
      if (updated?.avatar_url) {
        applyUser(updated)
      } else {
        const fresh = await authApi.me()
        applyUser(fresh)
      }
      notify('Аватар загружен')
    } catch (error) {
      notify(error.message, 'error')
    } finally {
      setUploading(false)
    }
  }

  /** Снять аватар — отправляем пустое значение. */
  async function handleRemoveAvatar() {
    setUploading(true)
    try {
      const updated = await usersApi.update({ avatar_url: null })
      applyUser(updated ?? (await authApi.me()))
      notify('Аватар удалён', 'info')
    } catch (error) {
      notify(error.message, 'error')
    } finally {
      setUploading(false)
    }
  }

  const avatar = resolveAssetUrl(user?.avatar_url)
  const data = stats.data

  return (
    <>
      <section className="welcome">
        <div>
          <p className="date">HabitQuest / Профиль</p>
          <h1>Мой профиль</h1>
          <p className="sub">Твоя история, уровень и личные результаты.</p>
        </div>

        <Button
          variant="secondary"
          icon={LogOut}
          onClick={async () => {
            await logout()
            navigate('/login')
          }}
        >
          Выйти из аккаунта
        </Button>
      </section>

      <div className="profile-layout">
        {/* Карточка пользователя */}
        <section className="panel profile-panel">
          <div className="avatar-wrapper">
            {avatar ? (
              <img className="profile-avatar profile-avatar-image" src={avatar} alt="Аватар пользователя" />
            ) : (
              <div className="profile-avatar">{initialOf(user?.username)}</div>
            )}

            <button
              type="button"
              className="avatar-upload"
              onClick={() => fileInput.current?.click()}
              disabled={uploading}
              aria-label="Загрузить аватар"
            >
              {uploading ? <Upload size={16} className="spin" /> : <Camera size={16} />}
            </button>

            <input
              ref={fileInput}
              type="file"
              accept="image/png,image/jpeg,image/webp,image/gif"
              onChange={handleAvatar}
              hidden
            />
          </div>

          <h2>{user?.username}</h2>
          <p className="sub">{user?.email}</p>
          <p className="level-tag">
            {levelTitle(user?.level ?? 1)} · уровень {user?.level ?? 1}
          </p>

          {user?.avatar_url ? (
            <Button variant="ghost" size="sm" icon={Trash2} onClick={handleRemoveAvatar}>
              Удалить аватар
            </Button>
          ) : (
            <p className="sub">JPG, PNG, WebP или GIF, не более 2 МБ.</p>
          )}

          <dl className="profile-facts">
            <div>
              <dt>Дата регистрации</dt>
              <dd>{formatFullDate(user?.created_at)}</dd>
            </div>
            <div>
              <dt>Всего опыта</dt>
              <dd>{formatNumber(user?.xp ?? 0)} XP</dd>
            </div>
          </dl>
        </section>

        <div className="profile-main">
          {/* Изменение имени */}
          <section className="panel">
            <div className="section-heading">
              <div>
                <h2>Личные данные</h2>
                <p>Имя отображается в меню и в приветствии</p>
              </div>
            </div>

            <form onSubmit={handleSaveName} noValidate className="profile-form">
              <Field
                label="Имя"
                name="username"
                required
                maxLength={50}
                value={username}
                onChange={(event) => {
                  setUsername(event.target.value)
                  setErrors({})
                }}
                error={errors.username}
              />
              <Button type="submit" icon={Save} loading={saving}>
                Сохранить
              </Button>
            </form>
          </section>

          {/* Сводная статистика */}
          <section>
            <div className="section-heading">
              <div>
                <h2>Сводная статистика</h2>
                <p>Данные из GET /api/users/me/stats</p>
              </div>
            </div>

            {stats.loading ? (
              <StatCardsSkeleton />
            ) : (
              <StateBlock
                loading={false}
                error={stats.error}
                isEmpty={false}
                onRetry={stats.reload}
              >
                <div className="stats-grid">
                  <StatCard
                    icon={Target}
                    label="Всего привычек"
                    value={data?.total_habits ?? 0}
                    suffix={`активных: ${data?.active_habits ?? 0}`}
                    tone="purple"
                  />
                  <StatCard
                    icon={Sparkles}
                    label="Выполнений"
                    value={formatNumber(data?.total_completions ?? 0)}
                    suffix="раз"
                    tone="blue"
                  />
                  <StatCard
                    icon={Flame}
                    label="Лучшая серия"
                    value={data?.best_streak ?? 0}
                    suffix="дней"
                    tone="orange"
                  />
                  <StatCard
                    icon={Trophy}
                    label="Достижения"
                    value={data?.achievements_unlocked ?? 0}
                    suffix="открыто"
                    tone="green"
                  />
                </div>
              </StateBlock>
            )}
          </section>
        </div>
      </div>
    </>
  )
}
