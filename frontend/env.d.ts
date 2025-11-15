/// <reference types="next" />
/// <reference types="next/image-types/global" />

// Environment variables type declarations
declare namespace NodeJS {
  interface ProcessEnv {
    // Public environment variables (accessible in browser)
    NEXT_PUBLIC_APP_NAME: string;
    NEXT_PUBLIC_APP_VERSION: string;
    NEXT_PUBLIC_API_URL: string;
    
    // Server-only environment variables
    NODE_ENV: 'development' | 'production' | 'test';
  }
}
