import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { defineConfig } from 'vite'

// https://vite.dev/config/
// Dev server cố định cổng 5174 (strictPort: cổng bận thì báo lỗi thay vì tự nhảy cổng khác,
// để localStorage — phiên đăng nhập, dữ liệu mock — luôn gắn với cùng 1 origin)
export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: { port: 5174, strictPort: true },
})
