import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  appType: 'mpa', // enables multi-page app mode — serves any .html file at the root
  build: {
    rollupOptions: {
      input: {
        main: 'index.html',
        apiTest: 'api-test.html',
      }
    }
  },
  server: {
    proxy: {
      '/api': {
        target: 'http://localhost:3001',
        changeOrigin: true,
      }
    }
  }
})
