import "@testing-library/jest-dom";
import { TextEncoder, TextDecoder } from "util";

// Polyfill for TextEncoder/TextDecoder (required for jsdom)
global.TextEncoder = TextEncoder;
global.TextDecoder = TextDecoder as typeof global.TextDecoder;

// Mock import.meta.env for tests
const mockEnv = {
  DEV: true,
  VITE_API_BASE_URL: "http://localhost:3000/api",
  VITE_APP_NAME: "rrent",
};

/* eslint-disable-next-line @typescript-eslint/no-explicit-any */
(global as any).import = {
  meta: { env: mockEnv },
};

// Also define it on globalThis for better compatibility
Object.defineProperty(globalThis, "import", {
  value: {
    meta: {
      env: mockEnv,
    },
  },
  writable: true,
  configurable: true,
});


