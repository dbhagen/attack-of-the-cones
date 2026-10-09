import { defineConfig } from 'vitest/config';
import { resolve } from 'path';

export default defineConfig({
  resolve: {
    alias: {
      '@': resolve(__dirname, './src'),
    },
  },
  server: {
    port: 3000,
    open: true,
  },
  build: {
    target: 'es2020',
    sourcemap: true,
  },
  test: {
    globals: true,
    // Pure-logic suites run in node: no test needs a DOM, so jsdom stays out of devDependencies.
    environment: 'node',
  },
});
