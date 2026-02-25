/** @type {import('jest').Config} */
module.exports = {
  moduleFileExtensions: ['js', 'json', 'ts'],
  rootDir: '.',
  roots: ['<rootDir>/test'],
  testRegex: '.e2e-spec.ts$',
  transform: {
    '^.+\\.ts$': [
      'ts-jest',
      {
        tsconfig: {
          target: 'ES2022',
          module: 'CommonJS',
          moduleResolution: 'node',
          esModuleInterop: true,
          emitDecoratorMetadata: true,
          experimentalDecorators: true,
          strict: true,
          strictPropertyInitialization: false,
          skipLibCheck: true,
          baseUrl: './',
          paths: { '@/*': ['src/*'] },
        },
      },
    ],
  },
  testEnvironment: 'node',
  testTimeout: 30000,
  globalSetup: '<rootDir>/test/setup.ts',
  globalTeardown: '<rootDir>/test/teardown.ts',
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/src/$1',
  },
};
