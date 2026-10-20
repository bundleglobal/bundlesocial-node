import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    environment: 'node',
    include: ['src/**/*.spec.ts'],
    // The suite runs against the live API, uploads included.
    testTimeout: 60000,
  },
});
