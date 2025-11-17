import "@testing-library/jest-dom";

// Mock import.meta.env for tests
const mockEnv = {
  DEV: true,
  VITE_API_BASE_URL: "http://localhost:3000",
};

/* eslint-disable-next-line @typescript-eslint/no-explicit-any */
(global as any).import = {
  meta: { env: mockEnv },
};


