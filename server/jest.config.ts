// jest.config.ts
import type { Config } from 'jest'

const config: Config = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  testMatch: ['**/tests/**/*.test.ts'],
  clearMocks: true,
  verbose: true,
  globals: {
    'ts-jest': {
      isolatedModules: true,
    },
  },
}

export default config
