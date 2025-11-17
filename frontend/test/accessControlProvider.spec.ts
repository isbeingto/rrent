/**
 * Access Control Provider Tests
 * 
 * 测试覆盖：
 * 1. 未登录用户 -> 全部拒绝
 * 2. admin 角色 -> 全部允许
 * 3. viewer 角色 -> 仅 list/show 允许
 * 4. operator 角色 -> organizations 不能修改，其他资源可操作
 */

import type { CanParams } from "@refinedev/core";
import { accessControlProvider, getCurrentUserRole, checkPermission } from "@providers/accessControlProvider";
import * as storageModule from "@shared/auth/storage";

describe("AccessControlProvider", () => {
  const resources = [
    "organizations",
    "properties",
    "units",
    "tenants",
    "leases",
    "payments",
  ];
  const actions = ["list", "show", "create", "edit", "delete"];

  beforeEach(() => {
    jest.clearAllMocks();
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe("getCurrentUserRole()", () => {
    it("应返回 null 当用户未登录", () => {
      jest.spyOn(storageModule, "loadAuth").mockReturnValue(null);
      expect(getCurrentUserRole()).toBeNull();
    });

    it("应从 user.role 读取角色", () => {
      jest.spyOn(storageModule, "loadAuth").mockReturnValue({
        token: "token",
        organizationId: "org-1",
        user: { id: "1", email: "admin@example.com", fullName: "Admin", role: "admin" },
      });
      expect(getCurrentUserRole()).toBe("ADMIN");
    });

    it("应从 user.roles[0] 读取角色", () => {
      jest.spyOn(storageModule, "loadAuth").mockReturnValue({
        token: "token",
        organizationId: "org-1",
        user: { id: "1", email: "viewer@example.com", fullName: "Viewer", roles: ["viewer"] },
      });
      expect(getCurrentUserRole()).toBe("VIEWER");
    });

    it("应将角色名称标准化为大写", () => {
      jest.spyOn(storageModule, "loadAuth").mockReturnValue({
        token: "token",
        organizationId: "org-1",
        user: { id: "1", email: "op@example.com", fullName: "Operator", role: "operator" },
      });
      expect(getCurrentUserRole()).toBe("OPERATOR");
    });
  });

  describe("checkPermission()", () => {
    it("应拒绝所有未登录用户的请求", () => {
      resources.forEach((resource) => {
        actions.forEach((action) => {
          const result = checkPermission(null, resource, action);
          expect(result.can).toBe(false);
          expect(result.reason).toContain("未登录");
        });
      });
    });

    it("ADMIN 应对所有资源和操作拥有权限", () => {
      resources.forEach((resource) => {
        actions.forEach((action) => {
          const result = checkPermission("ADMIN", resource, action);
          expect(result.can).toBe(true);
          expect(result.reason).toBeUndefined();
        });
      });
    });

    it("OWNER 应对所有资源和操作拥有权限", () => {
      resources.forEach((resource) => {
        actions.forEach((action) => {
          const result = checkPermission("OWNER", resource, action);
          expect(result.can).toBe(true);
          expect(result.reason).toBeUndefined();
        });
      });
    });

    it("VIEWER 应只能 list 和 show", () => {
      resources.forEach((resource) => {
        // 允许的操作
        ["list", "show"].forEach((action) => {
          const result = checkPermission("VIEWER", resource, action);
          expect(result.can).toBe(true);
        });

        // 拒绝的操作
        ["create", "edit", "delete"].forEach((action) => {
          const result = checkPermission("VIEWER", resource, action);
          expect(result.can).toBe(false);
          expect(result.reason).toContain("只读");
        });
      });
    });

    it("OPERATOR 不能修改 organizations", () => {
      ["create", "edit", "delete"].forEach((action) => {
        const result = checkPermission("OPERATOR", "organizations", action);
        expect(result.can).toBe(false);
        expect(result.reason).toContain("不能修改组织");
      });
    });

    it("OPERATOR 可以 list/show organizations", () => {
      ["list", "show"].forEach((action) => {
        const result = checkPermission("OPERATOR", "organizations", action);
        expect(result.can).toBe(true);
      });
    });

    it("OPERATOR 对其他资源拥有完整 CRUD 权限", () => {
      const otherResources = resources.filter((r) => r !== "organizations");
      otherResources.forEach((resource) => {
        actions.forEach((action) => {
          const result = checkPermission("OPERATOR", resource, action);
          expect(result.can).toBe(true);
        });
      });
    });

    it("STAFF 角色应与 OPERATOR 等效", () => {
      // STAFF 不能修改 organizations
      ["create", "edit", "delete"].forEach((action) => {
        const result = checkPermission("STAFF", "organizations", action);
        expect(result.can).toBe(false);
      });

      // STAFF 对其他资源有完整权限
      const otherResources = resources.filter((r) => r !== "organizations");
      otherResources.forEach((resource) => {
        actions.forEach((action) => {
          const result = checkPermission("STAFF", resource, action);
          expect(result.can).toBe(true);
        });
      });
    });
  });

  describe("accessControlProvider.can()", () => {
    it("应正确调用 checkPermission 并返回结果", async () => {
      jest.spyOn(storageModule, "loadAuth").mockReturnValue({
        token: "token",
        organizationId: "org-1",
        user: { id: "1", email: "admin@example.com", fullName: "Admin", role: "admin" },
      });

      const params: CanParams = {
        resource: "properties",
        action: "create",
      };

      const result = await accessControlProvider.can!(params);

      expect(result.can).toBe(true);
    });

    it("应拒绝 viewer 的 delete 操作", async () => {
      jest.spyOn(storageModule, "loadAuth").mockReturnValue({
        token: "token",
        organizationId: "org-1",
        user: { id: "1", email: "viewer@example.com", fullName: "Viewer", role: "viewer" },
      });

      const params: CanParams = {
        resource: "properties",
        action: "delete",
      };

      const result = await accessControlProvider.can!(params);

      expect(result.can).toBe(false);
      expect(result.reason).toContain("只读");
    });

    it("应拒绝 operator 修改 organizations", async () => {
      jest.spyOn(storageModule, "loadAuth").mockReturnValue({
        token: "token",
        organizationId: "org-1",
        user: { id: "1", email: "op@example.com", fullName: "Operator", role: "operator" },
      });

      const params: CanParams = {
        resource: "organizations",
        action: "edit",
      };

      const result = await accessControlProvider.can!(params);

      expect(result.can).toBe(false);
      expect(result.reason).toContain("不能修改组织");
    });

    it("应允许 operator 创建 properties", async () => {
      jest.spyOn(storageModule, "loadAuth").mockReturnValue({
        token: "token",
        organizationId: "org-1",
        user: { id: "1", email: "op@example.com", fullName: "Operator", role: "operator" },
      });

      const params: CanParams = {
        resource: "properties",
        action: "create",
      };

      const result = await accessControlProvider.can!(params);

      expect(result.can).toBe(true);
    });

    it("应拒绝未登录用户的所有请求", async () => {
      jest.spyOn(storageModule, "loadAuth").mockReturnValue(null);

      const params: CanParams = {
        resource: "properties",
        action: "list",
      };

      const result = await accessControlProvider.can!(params);

      expect(result.can).toBe(false);
      expect(result.reason).toContain("未登录");
    });
  });

  describe("accessControlProvider.can() - 基本场景", () => {
    it("应正确调用并返回 admin 权限", async () => {
      jest.spyOn(storageModule, "loadAuth").mockReturnValue({
        token: "token",
        organizationId: "org-1",
        user: { id: "1", email: "admin@example.com", fullName: "Admin", role: "admin" },
      });

      const params: CanParams = {
        resource: "properties",
        action: "create",
      };

      const result = await accessControlProvider.can!(params);

      expect(result.can).toBe(true);
    });

    it("应在开发模式输出 [ACCESS] 日志", async () => {
      const consoleSpy = jest.spyOn(console, "log").mockImplementation(() => {});

      jest.spyOn(storageModule, "loadAuth").mockReturnValue({
        token: "token",
        organizationId: "org-1",
        user: { id: "1", email: "admin@example.com", fullName: "Admin", role: "admin" },
      });

      const params: CanParams = {
        resource: "properties",
        action: "create",
      };

      await accessControlProvider.can!(params);

      // 在开发模式下，应该会有 [ACCESS] 日志
      // 注意：此测试依赖 DEV 环境变量，生产环境下不会输出日志
      if (process.env.NODE_ENV !== "production") {
        expect(consoleSpy).toHaveBeenCalledWith(
          "[ACCESS]",
          expect.objectContaining({
            role: "ADMIN",
            resource: "properties",
            action: "create",
          })
        );
      }

      consoleSpy.mockRestore();
    });
  });
});
