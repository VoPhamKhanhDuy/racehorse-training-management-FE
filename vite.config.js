import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { defineConfig, loadEnv } from 'vite'

// https://vite.dev/config/
// Dev server cố định cổng 5174 (strictPort: cổng bận thì báo lỗi thay vì tự nhảy cổng khác,
// để localStorage — phiên đăng nhập, dữ liệu mock — luôn gắn với cùng 1 origin)
// /api được proxy sang BE (SWP.API) nên FE gọi cùng origin, không vướng CORS / chứng chỉ HTTPS dev.
// BE chạy profile "http" ở cổng 5214; chạy chỗ khác thì đặt VITE_API_PROXY_TARGET trong .env.local (xem .env.example).
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')
  const apiTarget = env.VITE_API_PROXY_TARGET || 'http://localhost:5214'

  return {
    plugins: [react(), tailwindcss()],
    server: {
      port: 5174,
      strictPort: true,
      proxy: {
        '/api': { target: apiTarget, changeOrigin: true, secure: false },
        '/media': { target: apiTarget, changeOrigin: true, secure: false },
      },
    },
  }
})
