import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    proxy: {
      '/route': {
        target: 'http://127.0.0.1:8001',
        changeOrigin: true
      },
      '/routes': {
        target: 'http://127.0.0.1:8001',
        changeOrigin: true
      },
      '/geocode': {
        target: 'http://127.0.0.1:8001',
        changeOrigin: true
      },
      '/alerts': {
        target: 'http://127.0.0.1:8001',
        changeOrigin: true
      },
      '/telemetry': {
        target: 'http://127.0.0.1:8001',
        changeOrigin: true
      },
      '/health': {
        target: 'http://127.0.0.1:8001',
        changeOrigin: true
      },
      '/ws': {
        target: 'ws://127.0.0.1:8001',
        ws: true
      }
    }
  }
});
