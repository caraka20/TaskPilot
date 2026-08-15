// jest.config.ts
import type { Config } from 'jest'

const config: Config = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  roots: ['<rootDir>/tests'],
  testMatch: ['**/tests/**/*.test.ts'],
  modulePathIgnorePatterns: ['<rootDir>/dist/'],
  maxWorkers: 1,
  clearMocks: true,
  verbose: true,
  globals: {
    'ts-jest': {
      isolatedModules: true,
    },
  },
}

export default config
