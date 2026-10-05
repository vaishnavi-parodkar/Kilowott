import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    // Forward API calls to the Express backend (see ../backend)
    proxy: { '/api': { target: 'http://localhost:4000', changeOrigin: true } },
  },
  test: {
    environment: 'node',
    // Unit tests run against the in-browser mock; INTEGRATION=1 targets a running backend (npm run test:integration)
    env: { VITE_USE_BACKEND: process.env.INTEGRATION ? 'true' : 'false', VITE_API_BASE: process.env.API_BASE || 'http://localhost:4000/api' },
    include: ['src/tests/**/*.test.js'],
    setupFiles: ['src/tests/setup.js'],
  },
});
