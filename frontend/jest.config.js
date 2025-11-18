/** @type {import('jest').Config} */
const config = {
  preset: "ts-jest",
  testEnvironment: "jsdom",
  roots: ["<rootDir>/src", "<rootDir>/test"],
  testMatch: ["**/__tests__/**/*.ts?(x)", "**/?(*.)+(spec|test).ts?(x)"],
  moduleNameMapper: {
    "^@/(.*)$": "<rootDir>/src/$1",
    "^@shared/(.*)$": "<rootDir>/src/shared/$1",
    "^@components/(.*)$": "<rootDir>/src/components/$1",
    "^@pages/(.*)$": "<rootDir>/src/pages/$1",
    "^@providers/(.*)$": "<rootDir>/src/providers/$1",
  },
  transform: {
    "^.+\\.tsx?$": [
      "ts-jest",
      {
        tsconfig: {
          jsx: "react-jsx",
          esModuleInterop: true,
          allowSyntheticDefaultImports: true,
          module: "commonjs",
          target: "es2020",
          skipLibCheck: true,
        },
      },
    ],
  },
  setupFilesAfterEnv: ["<rootDir>/test/setup.ts"],
  collectCoverageFrom: [
    "src/**/*.{ts,tsx}",
    "!src/**/*.d.ts",
    "!src/index.tsx",
    "!src/vite-env.d.ts",
  ],
  moduleFileExtensions: ["ts", "tsx", "js", "jsx", "json", "node"],
};

export default config;
