import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig({
  plugins: [react(), tailwindcss()],
  // GitHub Pages отдаёт сайт из подпапки /<repo>/, локально — из корня.
  // Переопределяется переменной BASE_PATH, если репозиторий назван иначе.
  base: process.env.GITHUB_ACTIONS ? (process.env.BASE_PATH ?? '/lucevias/') : '/',
})
