import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    host: true,
    port: 5173,
    // Bind mounts no Windows/Docker Desktop nao propagam eventos inotify de
    // forma confiavel, entao o polling garante que o HMR funcione.
    watch: {
      usePolling: true,
    },
  },
})
