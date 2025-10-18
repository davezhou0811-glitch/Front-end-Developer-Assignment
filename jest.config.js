module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'jsdom',
  moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx'],
  setupFilesAfterEnv: ['@testing-library/jest-dom'],
  testMatch: ['**/*.test.ts', '**/*.test.tsx'],
  transform: {
    '^.+\\.(ts|tsx)$': ['ts-jest', { useESM: true }]
    // '^.+\\.(ts|tsx)$': 'ts-jest'
  },
  extensionsToTreatAsEsm: ['.ts', '.tsx'],

  // globals: {
  //   'ts-jest': {
  //     useESM: true
  //   }
  // },
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/$1' // <--- 重点：让 @/ 开头的路径别名能被 Jest 识别
  }
}
