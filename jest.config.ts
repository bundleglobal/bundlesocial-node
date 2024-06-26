import type { JestConfigWithTsJest } from 'ts-jest';

const config: JestConfigWithTsJest = {
  preset: 'ts-jest',
  clearMocks: true,
  restoreMocks: true,
  verbose: true,
  testEnvironment: 'node',
  prettierPath: null,
  testTimeout: 60000
};

export default config;