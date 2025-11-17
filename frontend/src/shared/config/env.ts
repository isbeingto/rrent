const DEFAULT_API_BASE_URL = "http://74.122.24.3:3000";
const ENV_NAME = "VITE_API_BASE_URL";

type ViteEnv = {
  DEV?: boolean;
  VITE_API_BASE_URL?: string;
};

function getViteEnv(): ViteEnv | undefined {
  // 首选 Vite 在浏览器 / dev 构建时注入的 import.meta.env
  // 通过访问 globalThis.import?.meta?.env 避免在不支持 import.meta 的环境下直接解析失败
  try {
    /* eslint-disable-next-line @typescript-eslint/no-explicit-any */
    const globalImport = (globalThis as any).import;
    const metaEnv = globalImport?.meta?.env as ViteEnv | undefined;
    if (metaEnv) {
      return metaEnv;
    }
  } catch {
    // ignore and use other fallbacks
  }

  // 测试环境：允许直接在 globalThis 上注入 VITE_API_BASE_URL / DEV 标记
  /* eslint-disable-next-line @typescript-eslint/no-explicit-any */
  const inlineEnv = (globalThis as any).__VITE_ENV__ as ViteEnv | undefined;
  if (inlineEnv) {
    return inlineEnv;
  }

  return undefined;
}

function resolveApiBaseUrl(): string {
  const viteEnv = getViteEnv();

  const configuredValue = viteEnv?.VITE_API_BASE_URL?.trim?.();

  if (configuredValue) {
    return configuredValue;
  }

  // 在 Vite dev server 中，如果无法正确探测到 DEV 标记，则默认视为开发环境，避免误判为生产导致白屏
  const isDev = viteEnv?.DEV ?? true;
  if (isDev) {
    return DEFAULT_API_BASE_URL;
  }

  const errorMessage = `[Env] ${ENV_NAME} is required in production`;
  console.error(errorMessage);
  throw new Error(errorMessage);
}

export const API_BASE_URL = resolveApiBaseUrl();
export const API_ENV_NAME = ENV_NAME;
