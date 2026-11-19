import { defineConfig } from 'vitest/config';
import { svelte } from '@sveltejs/vite-plugin-svelte';
import { svelteTesting } from '@testing-library/svelte/vite';

export default defineConfig({
  plugins: [svelte(), svelteTesting()],
  define: {
    __APP_VERSION__: JSON.stringify('0.0.0-test'),
    __BUILD_DATE__: JSON.stringify('2026-11-15T12:00:00Z'),
    __GIT_HASH__: JSON.stringify('abc1234'),
  },
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: ['./src/test-setup.ts'],
    include: ['src/**/*.test.ts', 'scripts/**/*.test.ts'],
  },
});
