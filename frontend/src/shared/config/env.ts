const DEFAULT_API_BASE_URL = "http://localhost:3000";
const ENV_NAME = "VITE_API_BASE_URL";

function resolveApiBaseUrl(): string {
  const configuredValue = import.meta.env.VITE_API_BASE_URL?.trim();

  if (configuredValue) {
    return configuredValue;
  }

  if (import.meta.env.DEV) {
    return DEFAULT_API_BASE_URL;
  }

  const errorMessage = `[Env] ${ENV_NAME} is required in production`;
  console.error(errorMessage);
  throw new Error(errorMessage);
}

export const API_BASE_URL = resolveApiBaseUrl();
export const API_ENV_NAME = ENV_NAME;
