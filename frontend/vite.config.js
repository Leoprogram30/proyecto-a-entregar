import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')
  // Backend PHP en desarrollo (php -S 127.0.0.1:8000 -t backend backend/router.php). Configurable con VITE_BACKEND_URL.
  const backend = env.VITE_BACKEND_URL || 'http://127.0.0.1:8000'

  return {
    // Rutas relativas: la app funciona en la raíz o en una subcarpeta (XAMPP, cPanel)
    base: './',
    plugins: [react(), tailwindcss()],
    server: {
      port: 5173,
      strictPort: true,
      proxy: {
        '/backend': {
          target: backend,
          changeOrigin: true,
          rewrite: (path) => path.replace(/^\/backend/, '')
        }
      }
    }
  }
})
