import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  // In local dev the React app is served by Vite (5173) while the API runs on 3000.
  // Proxy /api to the backend so same-origin ("") requests work without CORS or a hardcoded host.
  server: {
    proxy: {
      '/api': 'http://localhost:3000',
    },
  },
})
