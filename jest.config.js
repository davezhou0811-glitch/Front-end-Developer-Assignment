// module.exports = {
//   preset: 'ts-jest',
//   testEnvironment: 'jsdom',
//   moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx'],
//   setupFilesAfterEnv: ['@testing-library/jest-dom'],
//   testMatch: ['**/*.test.ts', '**/*.test.tsx'],
//   transform: {
//     '^.+\\.(ts|tsx)$': ['ts-jest', { useESM: true }]
//   },
//   extensionsToTreatAsEsm: ['.ts', '.tsx'],
//   moduleNameMapper: {
//     '^@/(.*)$': '<rootDir>/$1' // <--- 重点：让 @/ 开头的路径别名能被 Jest 识别
//   }
// }
module.exports = {
  testEnvironment: 'jsdom',
  preset: 'ts-jest',
  transform: {
    '^.+\\.(ts|tsx)$': [
      'ts-jest',
      {
        tsconfig: {
          jsx: 'react'
        }
      }
    ]
  },
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/$1'
  },
  setupFilesAfterEnv: ['<rootDir>/jest.setup.js'],
  testMatch: ['**/__tests__/**/*.(test|spec).(ts|tsx|js)', '**/*.(test|spec).(ts|tsx|js)']
}
