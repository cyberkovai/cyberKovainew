import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  base: '/',
  plugins: [react()],
  envPrefix: ['VITE_', 'RECAPTCHA_'],
  server: {
    port: 5173,
    proxy: {
      '/api': {
        target: 'http://localhost:5000',
        changeOrigin: true,
      },
      '/data/uploads': {
        target: 'http://localhost:5000',
        changeOrigin: true,
      },
    },
  },
});

