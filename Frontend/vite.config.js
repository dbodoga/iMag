import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
export default defineConfig({
  plugins: [react()],
  server: { port: 5189, strictPort: true, proxy: { '/api': process.env.IMAG_BACKEND_URL || 'http://localhost:5188' } },
  test: { include: ['src/**/*.test.{js,jsx}'], environment: 'jsdom', setupFiles: './src/test/setup.js', restoreMocks: true },
});