module.exports = {
  testEnvironment: 'node',
  collectCoverageFrom: [
    'controllers/**/*.js',
    'repositories/**/*.js',
    'middlewares/**/*.js',
    'routes/**/*.js',
    '!**/*.test.js',
    '!**/node_modules/**',
  ],
  coveragePathIgnorePatterns: [
    '/node_modules/',
    '/tests/',
  ],
  coverageDirectory: 'coverage',
  coverageReporters: ['text', 'text-summary', 'html', 'lcov', 'json'],
  setupFilesAfterEnv: ['<rootDir>/tests/setup.js'],
  testMatch: [
    '<rootDir>/tests/unit/**/*.test.js',
    '<rootDir>/tests/data/**/*.test.js',
  ],
  testTimeout: 10000,
  verbose: true,
  coverageThreshold: {
    global: {
      branches: 70,
      functions: 75,
      lines: 75,
      statements: 75,
    },
    './controllers/': {
      branches: 70,
      functions: 75,
      lines: 75,
      statements: 75,
    },
    './repositories/': {
      branches: 80,
      functions: 85,
      lines: 85,
      statements: 85,
    },
  },
};
