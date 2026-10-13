/**
 * Раздел «Настройки».
 *
 * Здесь собраны переключатель темы, сведения о подключении к серверу
 * и информация о проекте. Тема сохраняется в браузере и применяется
 * мгновенно, без перезагрузки страницы.
 */

import { useNavigate } from 'react-router-dom'
import { ExternalLink, LogOut, Moon, Palette, Server, Sun, SunMoon } from 'lucide-react'
import Button from '../components/ui/Button.jsx'
import { SERVER_URL } from '../api/client.js'
import { useAuth } from '../context/AuthContext.jsx'
import { useTheme } from '../context/ThemeContext.jsx'
import { useToast } from '../context/ToastContext.jsx'

const REPOSITORY_URL = 'https://github.com/sacura1337/habitquest'

export default function SettingsPage() {
  const { theme, setTheme } = useTheme()
  const { logout } = useAuth()
  const { notify } = useToast()
  const navigate = useNavigate()

  return (
    <>
      <section className="welcome">
        <div>
          <p className="date">HabitQuest / Настройки</p>
          <h1>Настройки</h1>
          <p className="sub">Настрой HabitQuest под себя.</p>
        </div>
      </section>

      <section className="panel settings-list">
        {/* Тема оформления — «звёздочка» задания 3 */}
        <div>
          <div>
            <h2>
              <Palette size={17} /> Внешний вид
            </h2>
            <p className="sub">
              Выберите удобную тему интерфейса. Выбор сохраняется в браузере
              и применяется при следующем открытии сайта.
            </p>
          </div>

          <div className="view-switch" role="group" aria-label="Тема оформления">
            <button
              type="button"
              className={theme === 'light' ? 'active' : ''}
              onClick={() => {
                setTheme('light')
                notify('Включена светлая тема', 'info')
              }}
              aria-pressed={theme === 'light'}
            >
              <Sun size={15} /> Светлая
            </button>
            <button
              type="button"
              className={theme === 'dark' ? 'active' : ''}
              onClick={() => {
                setTheme('dark')
                notify('Включена тёмная тема', 'info')
              }}
              aria-pressed={theme === 'dark'}
            >
              <Moon size={15} /> Тёмная
            </button>
          </div>
        </div>

        {/* Куда обращается приложение */}
        <div>
          <div>
            <h2>
              <Server size={17} /> Подключение к серверу
            </h2>
            <p className="sub">
              Адрес REST API задаётся переменной окружения <code>VITE_API_URL</code> при сборке
              проекта. Сейчас приложение обращается по адресу:
            </p>
            <p className="settings-code">{SERVER_URL}</p>
          </div>

          <a
            className="secondary-button"
            href={`${SERVER_URL}/docs`}
            target="_blank"
            rel="noopener noreferrer"
          >
            <ExternalLink size={15} /> Документация API
          </a>
        </div>

        {/* Сведения о проекте */}
        <div>
          <div>
            <h2>
              <SunMoon size={17} /> О приложении
            </h2>
            <p className="sub">
              HabitQuest v1.0 — учебный проект по учебной практике УП.08 «Разработка дизайна
              веб-приложений». Фронтенд: React 18, Vite, React Router. Бэкенд: FastAPI, SQLAlchemy,
              Alembic. База данных: SQLite в разработке, PostgreSQL при публикации.
            </p>
          </div>

          <a
            className="secondary-button"
            href={REPOSITORY_URL}
            target="_blank"
            rel="noopener noreferrer"
          >
            <ExternalLink size={15} /> Репозиторий
          </a>
        </div>

        {/* Выход */}
        <div>
          <div>
            <h2>
              <LogOut size={17} /> Завершение сессии
            </h2>
            <p className="sub">
              Токен доступа будет удалён из браузера. Привычки и статистика останутся в базе данных.
            </p>
          </div>

          <Button
            variant="secondary"
            icon={LogOut}
            onClick={async () => {
              await logout()
              navigate('/login')
            }}
          >
            Выйти
          </Button>
        </div>
      </section>
    </>
  )
}
