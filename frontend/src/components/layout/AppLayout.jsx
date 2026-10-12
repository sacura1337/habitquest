/**
 * Каркас кабинета: боковое меню, верхняя панель и содержимое раздела.
 *
 * Здесь же один раз загружается сводная статистика пользователя — она нужна
 * и меню (количество привычек, уровень), и верхней панели. Данные обновляются
 * при переходе между разделами, чтобы счётчики не устаревали.
 */

import { useCallback, useState } from 'react'
import { Outlet, useLocation } from 'react-router-dom'
import Sidebar from './Sidebar.jsx'
import Header from './Header.jsx'
import SiteFooter from './SiteFooter.jsx'
import BackToTop from './BackToTop.jsx'
import Breadcrumbs, { BreadcrumbProvider } from './Breadcrumbs.jsx'
import { users } from '../../api/index.js'
import { useAuth } from '../../context/AuthContext.jsx'
import { useFetch } from '../../hooks/useFetch.js'

export default function AppLayout() {
  const [menuOpen, setMenuOpen] = useState(false)
  const location = useLocation()
  const { user } = useAuth()

  // Сводная статистика профиля. Пересчитывается при каждом переходе
  // и после смены пользователя.
  const loadStats = useCallback(() => users.stats(), [])
  const { data: stats } = useFetch(loadStats, [location.pathname, user?.id], {
    enabled: Boolean(user),
  })

  const closeMenu = useCallback(() => setMenuOpen(false), [])

  return (
    <>
      <div className="app-shell">
        <Sidebar open={menuOpen} onClose={closeMenu} stats={stats} />

        <main className="main-area">
          <Header onOpenMenu={() => setMenuOpen(true)} />

          <div className="page-content">
            <BreadcrumbProvider>
              <Breadcrumbs />
              <Outlet context={{ stats }} />
            </BreadcrumbProvider>

            <SiteFooter />
          </div>
        </main>
      </div>

      <BackToTop />
    </>
  )
}
