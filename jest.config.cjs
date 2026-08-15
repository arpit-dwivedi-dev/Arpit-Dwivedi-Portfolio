module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  roots: ['<rootDir>/e2e', '<rootDir>/src'],
  testMatch: ['**/*.test.ts'],
};
