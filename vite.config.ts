import { defineConfig, loadEnv } from 'vite'
import uni from '@dcloudio/vite-plugin-uni'

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')

  return {
    base: env.VITE_APP_PUBLIC_BASE || '/',
    plugins: [
      uni(),
    ],
    server: {
      proxy: {
        '/api': {
          changeOrigin: true,
          secure: false,
          target: env.VITE_MES_API_PROXY_TARGET || 'https://localhost',
        },
      },
    },
  }
})
