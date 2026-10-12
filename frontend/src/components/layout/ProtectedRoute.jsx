/**
 * Защита закрытых разделов.
 *
 * Пока проверяется сохранённый токен, показывается заглушка загрузки.
 * Неавторизованный пользователь перенаправляется на страницу входа, а адрес,
 * с которого его вытеснили, сохраняется, чтобы вернуться туда после входа.
 */

import { Navigate, Outlet, useLocation } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext.jsx'
import { StatCardsSkeleton } from '../ui/Skeleton.jsx'

export default function ProtectedRoute() {
  const { isAuthenticated, initializing } = useAuth()
  const location = useLocation()

  if (initializing) {
    return (
      <div className="page-content" aria-busy="true">
        <p className="sub">Проверяем вход в систему…</p>
        <StatCardsSkeleton />
      </div>
    )
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace state={{ from: location.pathname + location.search }} />
  }

  return <Outlet />
}
