/**
 * Маршруты приложения (задание 4).
 *
 * Карта адресов повторяет карту сайта из технического задания:
 *
 *   /                     стартовая (публичная) страница с якорными разделами
 *   /login                вход
 *   /register             регистрация
 *   /app                  главная страница кабинета
 *   /app/habits           список привычек: таблица, фильтры, каталог
 *   /app/habits/:id       динамический маршрут одной привычки
 *   /app/statistics       статистика и история выполнения
 *   /app/achievements     достижения
 *   /app/profile          профиль и загрузка аватара
 *   /app/settings         настройки
 *   *                     страница 404
 *
 * Разделы кабинета защищены: без входа пользователь перенаправляется на /login.
 */

import { Route, Routes } from 'react-router-dom'
import AppLayout from './components/layout/AppLayout.jsx'
import ProtectedRoute from './components/layout/ProtectedRoute.jsx'
import ScrollToTop from './components/layout/ScrollToTop.jsx'
import LandingPage from './pages/LandingPage.jsx'
import LoginPage from './pages/LoginPage.jsx'
import RegisterPage from './pages/RegisterPage.jsx'
import DashboardPage from './pages/DashboardPage.jsx'
import HabitsPage from './pages/HabitsPage.jsx'
import HabitDetailPage from './pages/HabitDetailPage.jsx'
import StatisticsPage from './pages/StatisticsPage.jsx'
import AchievementsPage from './pages/AchievementsPage.jsx'
import ProfilePage from './pages/ProfilePage.jsx'
import SettingsPage from './pages/SettingsPage.jsx'
import NotFoundPage from './pages/NotFoundPage.jsx'

export default function App() {
  return (
    <>
      <ScrollToTop />

      <Routes>
        {/* Публичные страницы */}
        <Route path="/" element={<LandingPage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />

        {/* Закрытые разделы кабинета */}
        <Route element={<ProtectedRoute />}>
          <Route path="/app" element={<AppLayout />}>
            <Route index element={<DashboardPage />} />
            <Route path="habits" element={<HabitsPage />} />
            <Route path="habits/:id" element={<HabitDetailPage />} />
            <Route path="statistics" element={<StatisticsPage />} />
            <Route path="achievements" element={<AchievementsPage />} />
            <Route path="profile" element={<ProfilePage />} />
            <Route path="settings" element={<SettingsPage />} />
          </Route>
        </Route>

        {/* Несуществующий адрес */}
        <Route path="*" element={<NotFoundPage />} />
      </Routes>
    </>
  )
}
