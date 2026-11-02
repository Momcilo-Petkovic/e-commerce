import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { defineConfig } from 'vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: {
    // During development, API calls are forwarded to the Spring Boot backend,
    // so the frontend can use relative URLs (/api/...) and no CORS setup is needed.
    proxy: {
      '/api': 'http://localhost:8080',
    },
  },
})
