import React from 'react'
import { createRoot } from 'react-dom/client'
import App from './App.jsx'
import './styles/tokens.css'
import './styles/global.css'

// Точка входа: загружаем приложение и глобальные стили.
createRoot(document.getElementById('root')).render(<React.StrictMode><App /></React.StrictMode>)
