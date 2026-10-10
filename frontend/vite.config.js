import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// Подключаем плагин React для сборки JSX-компонентов.
//
// Базовый путь сборки нужен для публикации в подкаталоге: GitHub Pages отдаёт
// сайт по адресу https://<аккаунт>.github.io/habitquest/, поэтому workflow
// публикации передаёт VITE_BASE=/habitquest/. Для хостинга в корне домена
// (Vercel, Netlify) подходит значение по умолчанию '/'.
export default defineConfig({
  base: process.env.VITE_BASE ?? '/',
  plugins: [react()],
})
