import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// Only override VITE_BRAND when explicitly set (e.g. local dev).
// In production (Vercel), leave it unset so runtime domain detection works.
const brand = process.env.VITE_BRAND || '';

// Brand-specific ports for local dev
const brandPorts = {
  lit: 5173,
  ttv: 1313,
  law: 7777,
  deb: 5555,
  mat: 5174,
  signphony: 5175
};

export default defineConfig({
  plugins: [react()],
  server: {
    port: brandPorts[brand] || 5173
  },
  define: brand
    ? { 'import.meta.env.VITE_BRAND': JSON.stringify(brand) }
    : {},
  test: {
    include: ['src/test/**/*.{test,spec}.{js,jsx,ts,tsx}'],
    exclude: ['**/node_modules/**', 'tests/e2e/**'],
    environment: 'jsdom',
    setupFiles: './src/test/setup.js',
    css: true,
    globals: true,
    testTimeout: 15000,
    coverage: {
      provider: 'v8',
      all: true,
      include: ['src/**/*.{js,jsx}'],
      reporter: ['text', 'json', 'html'],
      exclude: ['src/main.jsx'],
      thresholds: {
        lines: 90,
        functions: 80,
        branches: 80,
        statements: 90
      }
    }
  }
});
