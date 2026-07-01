module.exports = {
  testEnvironment: 'node',
  verbose: true,
  forceExit: true,
  clearMocks: true,
  testMatch: ['**/tests/**/*.test.js'],
  setupFilesAfterEnv: ['<rootDir>/tests/setup.js'],
  collectCoverage: false,
};