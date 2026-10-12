/**
 * Точка входа приложения.
 *
 * Порядок обёрток важен: тема оформления доступна везде, уведомления нужны
 * и до входа в систему, авторизация — до маршрутов, а маршрутизатор —
 * до страниц.
 *
 * Используется HashRouter: сайт опубликован на GitHub Pages, который отдаёт
 * только статические файлы и не умеет перенаправлять произвольные адреса
 * на index.html. При обычном BrowserRouter ссылка вида /app/habits/3
 * сломалась бы при обновлении страницы, а с HashRouter она работает всегда.
 */

import React from 'react'
import { createRoot } from 'react-dom/client'
import { HashRouter } from 'react-router-dom'
import App from './App.jsx'
import { AuthProvider } from './context/AuthContext.jsx'
import { ThemeProvider } from './context/ThemeContext.jsx'
import { ToastProvider } from './context/ToastContext.jsx'
import './styles/tokens.css'
import './styles/global.css'
import './styles/components.css'

createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <ThemeProvider>
      <ToastProvider>
        <AuthProvider>
          <HashRouter>
            <App />
          </HashRouter>
        </AuthProvider>
      </ToastProvider>
    </ThemeProvider>
  </React.StrictMode>,
)
