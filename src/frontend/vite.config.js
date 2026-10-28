import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  // strictPort: cổng 5173 đang bận thì báo lỗi, KHÔNG tự sang 5174/5175 (backend chỉ cho phép CORS từ 5173)
  server: { port: 5173, strictPort: true },
});
