import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  base: './',
  plugins: [react()],
  server: {
    host: '0.0.0.0',
    port: 5173,
    proxy: {
      '/parties': { target: 'http://127.0.0.1:7777', changeOrigin: true },
      '/health':  { target: 'http://127.0.0.1:7777', changeOrigin: true },
      '/socket.io': { target: 'http://127.0.0.1:7777', ws: true, changeOrigin: true },
    },
  },
  test: {
    globals:     true,
    environment: 'jsdom',
    setupFiles:  './tests/setup.js',
    include:     ['tests/**/*.test.{js,jsx}'],
  },
})
