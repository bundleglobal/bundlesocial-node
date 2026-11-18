import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    environment: 'node',
    include: ['src/**/*.spec.ts'],
    // The suite runs against the live API, uploads included; uploads alone can take a minute or more.
    testTimeout: 180000,
  },
});
