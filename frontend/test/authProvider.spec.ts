/**
 * Auth Provider 单元测试
 * 
 * 测试 authProvider 的各种场景：
 * - check: 已登录/未登录状态
 * - logout: 清理存储和重定向
 * - getPermissions: 获取角色信息
 */

import { authProvider } from "../src/providers/authProvider";
import { saveAuth, type AuthPayload } from "../src/shared/auth/storage";

// Mock localStorage
const localStorageMock = (() => {
  let store: Record<string, string> = {};

  return {
    getItem: (key: string) => store[key] || null,
    setItem: (key: string, value: string) => {
      store[key] = value.toString();
    },
    removeItem: (key: string) => {
      delete store[key];
    },
    clear: () => {
      store = {};
    },
  };
})();

Object.defineProperty(globalThis, "localStorage", {
  value: localStorageMock,
  writable: true,
});

describe("Auth Provider", () => {
  beforeEach(() => {
    localStorageMock.clear();
  });

  describe("check", () => {
    it("should return authenticated when valid token exists", async () => {
      const authPayload: AuthPayload = {
        token: "valid-token",
        organizationId: "org-123",
        user: {
          id: "user-123",
          email: "test@example.com",
          role: "ADMIN",
        },
      };
      saveAuth(authPayload);

      const result = await authProvider.check?.();

      expect(result).toEqual({
        authenticated: true,
      });
    });

    it("should return unauthenticated when no token exists", async () => {
      const result = await authProvider.check?.();

      expect(result).toEqual({
        authenticated: false,
        redirectTo: "/login",
        logout: true,
      });
    });
  });

  describe("logout", () => {
    it("should clear storage and return redirectTo", async () => {
      const authPayload: AuthPayload = {
        token: "valid-token",
        organizationId: "org-123",
        user: {
          id: "user-123",
          email: "test@example.com",
        },
      };
      saveAuth(authPayload);

      const result = await authProvider.logout?.({});

      expect(result).toEqual({
        success: true,
        redirectTo: "/login",
      });

      // Verify storage is cleared
      expect(localStorageMock.getItem("rrent_auth")).toBeNull();
    });
  });

  describe("getPermissions", () => {
    it("should return roles array when auth exists", async () => {
      const authPayload: AuthPayload = {
        token: "valid-token",
        organizationId: "org-123",
        user: {
          id: "user-123",
          email: "test@example.com",
          role: "ADMIN",
          roles: ["ADMIN", "USER"],
        },
      };
      saveAuth(authPayload);

      const result = await authProvider.getPermissions?.();

      expect(result).toEqual(["ADMIN", "USER"]);
    });

    it("should return single role as array when roles not provided", async () => {
      const authPayload: AuthPayload = {
        token: "valid-token",
        organizationId: "org-123",
        user: {
          id: "user-123",
          email: "test@example.com",
          role: "USER",
        },
      };
      saveAuth(authPayload);

      const result = await authProvider.getPermissions?.();

      expect(result).toEqual(["USER"]);
    });

    it("should return null when no auth exists", async () => {
      const result = await authProvider.getPermissions?.();

      expect(result).toBeNull();
    });
  });

  describe("getIdentity", () => {
    it("should return user identity when auth exists", async () => {
      const authPayload: AuthPayload = {
        token: "valid-token",
        organizationId: "org-123",
        user: {
          id: "user-123",
          email: "test@example.com",
          fullName: "Test User",
        },
      };
      saveAuth(authPayload);

      const result = await authProvider.getIdentity?.();

      expect(result).toEqual({
        id: "user-123",
        email: "test@example.com",
        name: "Test User",
        avatar: undefined,
      });
    });

    it("should use email as name when fullName not provided", async () => {
      const authPayload: AuthPayload = {
        token: "valid-token",
        organizationId: "org-123",
        user: {
          id: "user-123",
          email: "test@example.com",
        },
      };
      saveAuth(authPayload);

      const result = await authProvider.getIdentity?.();

      expect(result).toEqual({
        id: "user-123",
        email: "test@example.com",
        name: "test@example.com",
        avatar: undefined,
      });
    });

    it("should return null when no auth exists", async () => {
      const result = await authProvider.getIdentity?.();

      expect(result).toBeNull();
    });
  });
});
