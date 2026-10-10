import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
// Подключаем плагин React для сборки JSX-компонентов.
export default defineConfig({ plugins: [react()] })