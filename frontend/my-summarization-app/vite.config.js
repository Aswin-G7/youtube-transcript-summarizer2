import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      // Replace 'http://localhost:5000' with your backend's address if it's different
      '/api': 'http://localhost:5000',
    },
  },
})
