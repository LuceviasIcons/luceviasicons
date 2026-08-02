import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

/**
 * Библиотечная сборка: ESM-бандл + внешний React.
 * Компоненты в src/ генерируются скриптом, руками их не правят.
 */
export default defineConfig({
  plugins: [react()],
  build: {
    lib: {
      entry: 'src/index.ts',
      formats: ['es'],
      fileName: () => 'index.js',
    },
    rollupOptions: {
      external: ['react', 'react/jsx-runtime'],
    },
    // иконок много, но каждая — пара килобайт; предупреждение только шумит
    chunkSizeWarningLimit: 2000,
  },
})
