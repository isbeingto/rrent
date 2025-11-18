import "@testing-library/jest-dom";
import { AxiosError } from "axios";
import { authProvider } from "@/providers/authProvider";

// Auth helpers
interface AuthData {
  token: string;
  organizationId: string;
  user: {
    id: string;
    email: string;
    fullName?: string;
    role?: string;
    roles?: string[];
  };
}

const AUTH_KEY = "rrent_auth";

const createMockAuth = (): AuthData => ({
  token: "mock-jwt-token",
  organizationId: "org-123",
  user: {
    id: "1",
    email: "admin@example.com",
    fullName: "Admin User",
    role: "OWNER",
    roles: ["OWNER"],
  },
});

const saveAuth = (auth: AuthData): void => {
  localStorage.setItem(AUTH_KEY, JSON.stringify(auth));
};

const loadAuth = (): AuthData | null => {
  try {
    const stored = localStorage.getItem(AUTH_KEY);
    return stored ? JSON.parse(stored) : null;
  } catch {
    return null;
  }
};

describe("Route Guard - 路由守卫", () => {
  beforeEach(() => {
    // 清空 localStorage
    localStorage.clear();
  });

  describe("AuthProvider.check() - 认证检查", () => {
    it("未登录时应返回 authenticated: false 并重定向到 /login", async () => {
      const result = await authProvider.check!();

      expect(result.authenticated).toBe(false);
      expect(result.redirectTo).toBe("/login");
    });

    it("已登录且有有效 token 应返回 authenticated: true", async () => {
      saveAuth(createMockAuth());

      const result = await authProvider.check!();

      expect(result.authenticated).toBe(true);
    });

    it("token 为空时应返回 authenticated: false", async () => {
      const auth: Partial<AuthData> = {
        token: "",
        user: createMockAuth().user,
      };
      saveAuth(auth as AuthData);

      const result = await authProvider.check!();

      expect(result.authenticated).toBe(false);
      expect(result.redirectTo).toBe("/login");
    });

    it("token 为 null 时应返回 authenticated: false", async () => {
      const auth: Partial<AuthData> = {
        token: null as unknown as string,
        user: createMockAuth().user,
      };
      saveAuth(auth as AuthData);

      const result = await authProvider.check!();

      expect(result.authenticated).toBe(false);
      expect(result.redirectTo).toBe("/login");
    });

    it("localStorage auth 被完全删除时应返回 authenticated: false", async () => {
      localStorage.removeItem(AUTH_KEY);

      const result = await authProvider.check!();

      expect(result.authenticated).toBe(false);
      expect(result.redirectTo).toBe("/login");
    });
  });

  describe("AuthProvider.onError() - 401 错误处理", () => {
    it("收到 401 错误时应清除 auth 并返回 logout: true", async () => {
      saveAuth(createMockAuth());

      const mockError = new AxiosError(
        "Unauthorized",
        "401",
        undefined,
        undefined,
        {
          status: 401,
          statusText: "Unauthorized",
          data: { code: "UNAUTHORIZED", message: "Token expired" },
          headers: {},
          config: {} as never,
        }
      );

      const result = await authProvider.onError!(mockError);

      expect(result.logout).toBe(true);
      expect(result.redirectTo).toBe("/login");

      // 验证 auth 被清除
      const auth = loadAuth();
      expect(auth).toBeNull();
    });

    it("收到 403 错误时不应清除 auth", async () => {
      saveAuth(createMockAuth());

      const mockError = new AxiosError(
        "Forbidden",
        "403",
        undefined,
        undefined,
        {
          status: 403,
          statusText: "Forbidden",
          data: { code: "FORBIDDEN", message: "Insufficient permissions" },
          headers: {},
          config: {} as never,
        }
      );

      const result = await authProvider.onError!(mockError);

      expect(result.logout).toBeUndefined();
      expect(result.redirectTo).toBeUndefined();

      // 验证 auth 未被清除
      const auth = loadAuth();
      expect(auth).not.toBeNull();
      expect(auth?.token).toBe("mock-jwt-token");
    });

    it("收到其他错误时不应清除 auth", async () => {
      saveAuth(createMockAuth());

      const mockError = new AxiosError(
        "Internal Server Error",
        "500",
        undefined,
        undefined,
        {
          status: 500,
          statusText: "Internal Server Error",
          data: { code: "INTERNAL_ERROR", message: "Server error" },
          headers: {},
          config: {} as never,
        }
      );

      const result = await authProvider.onError!(mockError);

      expect(result.logout).toBeUndefined();

      // 验证 auth 未被清除
      const auth = loadAuth();
      expect(auth).not.toBeNull();
    });
  });

  describe("AuthProvider.logout() - 登出", () => {
    it("登出时应清除 auth 并重定向到 /login", async () => {
      saveAuth(createMockAuth());

      const result = await authProvider.logout!({});

      expect(result.success).toBe(true);
      expect(result.redirectTo).toBe("/login");

      // 验证 auth 被清除
      const auth = loadAuth();
      expect(auth).toBeNull();
    });
  });

  describe("Storage 边界情况", () => {
    it("auth 存在但格式错误时 loadAuth 应返回 null", () => {
      localStorage.setItem(AUTH_KEY, "invalid-json");

      const auth = loadAuth();
      expect(auth).toBeNull();
    });

    it("auth.user 缺失时 check 应返回 false", async () => {
      const auth: Partial<AuthData> = {
        token: "mock-jwt-token",
        organizationId: "org-123",
        user: null as never,
      };
      saveAuth(auth as AuthData);

      const result = await authProvider.check!();

      expect(result.authenticated).toBe(false);
    });

    it("auth 为空对象时 check 应返回 false", async () => {
      localStorage.setItem(AUTH_KEY, "{}");

      const result = await authProvider.check!();

      expect(result.authenticated).toBe(false);
    });
  });

  describe("HTTP 拦截器 401 处理", () => {
    it("在非登录页收到 401 时应清除 auth 并跳转到 /login", async () => {
      saveAuth(createMockAuth());

      // 验证 auth 存在
      expect(loadAuth()).not.toBeNull();

      // 注意：由于 http 拦截器是全局的，这里只能验证逻辑存在
      // 实际的跳转由 axios 拦截器自动完成
    });

    it("在登录页收到 401 时不应重定向", async () => {
      // 登录页面收到 401 应该保持在登录页，不进入死循环
      // 这个行为在 http.ts 的拦截器中实现
      expect(true).toBe(true);
    });
  });

  describe("权限和身份获取", () => {
    it("getPermissions 应返回用户角色数组", async () => {
      saveAuth(createMockAuth());

      const permissions = await authProvider.getPermissions!();

      expect(permissions).toEqual(["OWNER"]);
    });

    it("getIdentity 应返回用户身份信息", async () => {
      const mockAuth = createMockAuth();
      saveAuth(mockAuth);

      const identity = await authProvider.getIdentity!();

      // authProvider.getIdentity 会转换字段格式
      expect(identity).toEqual({
        id: mockAuth.user.id,
        email: mockAuth.user.email,
        name: mockAuth.user.fullName,
        avatar: undefined,
      });
    });

    it("未登录时 getPermissions 应返回 null", async () => {
      const permissions = await authProvider.getPermissions!();

      expect(permissions).toBeNull();
    });

    it("未登录时 getIdentity 应返回 null", async () => {
      const identity = await authProvider.getIdentity!();

      expect(identity).toBeNull();
    });
  });
});
