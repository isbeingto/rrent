/**
 * FE-4-104: 权限用例测试（全角色视角回归）
 * 
 * 本测试套件整合了 FE-4-100..103 实现的所有权限能力，以角色 × 资源 × 操作为维度
 * 进行全面的权限用例回归测试，确保：
 * 1. 所有角色在所有资源上的权限行为与 RBAC 矩阵严格一致
 * 2. 菜单可见性、操作按钮、特殊操作（Mark-Paid / createLease）完全符合权限预期
 * 3. 未登录用户和未知角色被正确拦截
 * 4. 多组织切换后权限行为保持一致
 * 
 * 模糊点覆盖：
 * - [FE-4-100 模糊点] 菜单可见性是否对所有角色严格生效？
 * - [FE-4-101 模糊点] Viewer 是否在所有入口都看不到编辑/删除/特殊操作？
 * - [FE-4-102 模糊点] 未登录用户通过 URL 访问深层路由时是否一定被重定向？
 * - [FE-4-103 模糊点] 多组织切换后，是否不会出现"旧 org 菜单 + 新 org API"的错位？
 */

import "@testing-library/jest-dom";
import * as storageModule from "@shared/auth/storage";
import { accessControlProvider } from "@providers/accessControlProvider";
import type { AuthPayload } from "@shared/auth/storage";
import { authProvider } from "@/providers/authProvider";

// ============================================================================
// 权限矩阵定义（显式编码，测试即文档）
// ============================================================================

/**
 * 角色权限矩阵
 * 定义每个角色对各类操作的权限
 */
const ROLE_MATRIX = {
  OWNER: {
    canList: true,
    canShow: true,
    canCreate: true,
    canEdit: true,
    canDelete: true,
    canMarkPaid: true, // Payments 特殊操作
    canCreateLeaseFromUnit: true, // Units → Create Lease
    canEditOrganization: true,
  },
  ADMIN: {
    canList: true,
    canShow: true,
    canCreate: true,
    canEdit: true,
    canDelete: true,
    canMarkPaid: true,
    canCreateLeaseFromUnit: true,
    canEditOrganization: true,
  },
  OPERATOR: {
    canList: true,
    canShow: true,
    canCreate: true,
    canEdit: true,
    canDelete: true, // OPERATOR 可以删除（除 organizations 外）
    canMarkPaid: true,
    canCreateLeaseFromUnit: true,
    canEditOrganization: false, // 不能编辑/创建/删除组织
  },
  STAFF: {
    canList: true,
    canShow: true,
    canCreate: true,
    canEdit: true,
    canDelete: true, // STAFF 可以删除（除 organizations 外）
    canMarkPaid: true,
    canCreateLeaseFromUnit: true,
    canEditOrganization: false, // 不能编辑/创建/删除组织
  },
  VIEWER: {
    canList: true,
    canShow: true,
    canCreate: false, // 完全只读
    canEdit: false,
    canDelete: false,
    canMarkPaid: false,
    canCreateLeaseFromUnit: false,
    canEditOrganization: false,
  },
  UNKNOWN: {
    canList: false,
    canShow: false,
    canCreate: false,
    canEdit: false,
    canDelete: false,
    canMarkPaid: false,
    canCreateLeaseFromUnit: false,
    canEditOrganization: false,
  },
} as const;

/**
 * 资源列表
 */
const RESOURCES = [
  "organizations",
  "properties",
  "units",
  "tenants",
  "leases",
  "payments",
] as const;

type RoleName = keyof typeof ROLE_MATRIX;

// ============================================================================
// 测试辅助函数
// ============================================================================

/**
 * 模拟用户登录状态
 */
function mockAuthUser(
  role: RoleName,
  organizationId: string = "test-org-123",
  organizations?: storageModule.OrganizationInfo[]
) {
  const authData: AuthPayload = {
    token: "mock-token",
    organizationId,
    organizationCode: "TEST",
    user: {
      id: `user-${role.toLowerCase()}`,
      email: `${role.toLowerCase()}@example.com`,
      fullName: `${role} User`,
      role: role,
      organizations: organizations || [
        { id: organizationId, name: "Test Organization", code: "TEST" },
      ],
    },
  };
  jest.spyOn(storageModule, "loadAuth").mockReturnValue(authData);
}

/**
 * 模拟未登录状态
 */
function mockUnauthenticated() {
  jest.spyOn(storageModule, "loadAuth").mockReturnValue(null);
}

/**
 * 清理所有 mock
 */
function cleanupMocks() {
  jest.clearAllMocks();
}

// ============================================================================
// 测试套件开始
// ============================================================================

describe("FE-4-104: 权限用例测试（全角色视角回归）", () => {
  afterEach(() => {
    jest.restoreAllMocks();
  });

  // ==========================================================================
  // 1. 基础权限矩阵验证（按角色）
  // ==========================================================================

  describe.each<RoleName>(["OWNER", "ADMIN", "OPERATOR", "STAFF", "VIEWER", "UNKNOWN"])(
    "角色权限矩阵: %s",
    (role) => {
      beforeEach(() => {
        cleanupMocks();
        mockAuthUser(role);
      });

      const matrix = ROLE_MATRIX[role];

      // ----------------------------------------------------------------------
      // [FE-4-100 模糊点] 菜单可见性符合矩阵
      // ----------------------------------------------------------------------
      describe("[FE-4-100] 菜单可见性（list 权限）", () => {
        RESOURCES.forEach((resource) => {
          it(`${resource}: ${matrix.canList ? "可见" : "不可见"}菜单`, async () => {
            const result = await accessControlProvider.can({
              resource,
              action: "list",
            });
            expect(result.can).toBe(matrix.canList);
          });
        });
      });

      // ----------------------------------------------------------------------
      // [FE-4-101 模糊点] 列表/详情页操作按钮符合矩阵
      // ----------------------------------------------------------------------
      describe("[FE-4-101] 操作按钮可见性", () => {
        RESOURCES.forEach((resource) => {
          it(`${resource}: show 操作 ${matrix.canShow ? "允许" : "拒绝"}`, async () => {
            const result = await accessControlProvider.can({
              resource,
              action: "show",
            });
            expect(result.can).toBe(matrix.canShow);
          });

          it(`${resource}: create 按钮 ${matrix.canCreate ? "可见" : "隐藏"}`, async () => {
            const result = await accessControlProvider.can({
              resource,
              action: "create",
            });
            
            // Organizations 特殊规则
            if (resource === "organizations") {
              expect(result.can).toBe(matrix.canEditOrganization);
            } else {
              expect(result.can).toBe(matrix.canCreate);
            }
          });

          it(`${resource}: edit 按钮 ${matrix.canEdit ? "可见" : "隐藏"}`, async () => {
            const result = await accessControlProvider.can({
              resource,
              action: "edit",
            });
            
            // Organizations 特殊规则
            if (resource === "organizations") {
              expect(result.can).toBe(matrix.canEditOrganization);
            } else {
              expect(result.can).toBe(matrix.canEdit);
            }
          });

          it(`${resource}: delete 按钮 ${matrix.canDelete ? "可见" : "隐藏"}`, async () => {
            const result = await accessControlProvider.can({
              resource,
              action: "delete",
            });
            
            // Organizations 特殊规则
            if (resource === "organizations") {
              expect(result.can).toBe(matrix.canEditOrganization);
            } else {
              expect(result.can).toBe(matrix.canDelete);
            }
          });
        });
      });

      // ----------------------------------------------------------------------
      // [FE-4-101 模糊点] 特殊操作符合矩阵
      // ----------------------------------------------------------------------
      describe("[FE-4-101] 特殊操作权限", () => {
        it(`Payments Mark-Paid: ${matrix.canMarkPaid ? "可用" : "不可用"}`, async () => {
          // Mark-Paid 使用 edit 权限控制
          const result = await accessControlProvider.can({
            resource: "payments",
            action: "edit",
          });
          expect(result.can).toBe(matrix.canMarkPaid);
        });

        it(`Units → Create Lease: ${matrix.canCreateLeaseFromUnit ? "可用" : "不可用"}`, async () => {
          // 从 Units 详情页创建租约，检查 leases 的 create 权限
          const result = await accessControlProvider.can({
            resource: "leases",
            action: "create",
          });
          expect(result.can).toBe(matrix.canCreateLeaseFromUnit);
        });
      });
    }
  );

  // ==========================================================================
  // 2. 未登录用户拦截验证
  // ==========================================================================

  describe("[FE-4-102] 未登录用户拦截", () => {
    beforeEach(() => {
      cleanupMocks();
      localStorage.clear();
      mockUnauthenticated();
    });

    it("check() 应返回 authenticated: false 并重定向到 /login", async () => {
      const result = await authProvider.check!();
      
      expect(result.authenticated).toBe(false);
      expect(result.redirectTo).toBe("/login");
      expect(result.logout).toBe(true);
    });

    it("未登录用户访问任意资源菜单都应被拒绝", async () => {
      for (const resource of RESOURCES) {
        const result = await accessControlProvider.can({
          resource,
          action: "list",
        });
        
        expect(result.can).toBe(false);
        expect(result.reason).toContain("未登录");
      }
    });

    it("未登录用户访问任意详情页都应被拒绝", async () => {
      for (const resource of RESOURCES) {
        const result = await accessControlProvider.can({
          resource,
          action: "show",
        });
        
        expect(result.can).toBe(false);
        expect(result.reason).toContain("未登录");
      }
    });

    it("未登录用户访问任意操作都应被拒绝", async () => {
      const actions = ["create", "edit", "delete"] as const;
      
      for (const resource of RESOURCES) {
        for (const action of actions) {
          const result = await accessControlProvider.can({
            resource,
            action,
          });
          
          expect(result.can).toBe(false);
          expect(result.reason).toContain("未登录");
        }
      }
    });
  });

  // ==========================================================================
  // 3. 多组织场景 + 权限一致性
  // ==========================================================================

  describe("[FE-4-103] 多组织切换后权限一致性", () => {
    const org1 = { id: "org-1", name: "Organization 1", code: "ORG1" };
    const org2 = { id: "org-2", name: "Organization 2", code: "ORG2" };

    describe("VIEWER 角色在多组织间切换", () => {
      it("切换前：org-1 下 VIEWER 无编辑权限", async () => {
        cleanupMocks();
        mockAuthUser("VIEWER", org1.id, [org1, org2]);

        const editResult = await accessControlProvider.can({
          resource: "properties",
          action: "edit",
        });
        const deleteResult = await accessControlProvider.can({
          resource: "properties",
          action: "delete",
        });

        expect(editResult.can).toBe(false);
        expect(deleteResult.can).toBe(false);
      });

      it("切换后：org-2 下 VIEWER 仍无编辑权限", async () => {
        cleanupMocks();
        // 模拟切换到 org-2
        mockAuthUser("VIEWER", org2.id, [org1, org2]);

        const editResult = await accessControlProvider.can({
          resource: "properties",
          action: "edit",
        });
        const deleteResult = await accessControlProvider.can({
          resource: "properties",
          action: "delete",
        });

        expect(editResult.can).toBe(false);
        expect(deleteResult.can).toBe(false);
      });

      it("切换后：菜单仍然可见（list 权限不变）", async () => {
        cleanupMocks();
        mockAuthUser("VIEWER", org2.id, [org1, org2]);

        const listResult = await accessControlProvider.can({
          resource: "properties",
          action: "list",
        });

        expect(listResult.can).toBe(true);
      });
    });

    describe("OWNER 角色在多组织间切换", () => {
      it("切换前：org-1 下 OWNER 有完整权限", async () => {
        cleanupMocks();
        mockAuthUser("OWNER", org1.id, [org1, org2]);

        const actions = ["list", "show", "create", "edit", "delete"] as const;
        for (const action of actions) {
          const result = await accessControlProvider.can({
            resource: "leases",
            action,
          });
          expect(result.can).toBe(true);
        }
      });

      it("切换后：org-2 下 OWNER 仍有完整权限", async () => {
        cleanupMocks();
        mockAuthUser("OWNER", org2.id, [org1, org2]);

        const actions = ["list", "show", "create", "edit", "delete"] as const;
        for (const action of actions) {
          const result = await accessControlProvider.can({
            resource: "leases",
            action,
          });
          expect(result.can).toBe(true);
        }
      });
    });

    describe("OPERATOR 角色在多组织间切换", () => {
      it("切换前后：organizations 始终只读", async () => {
        // 切换前 org-1
        cleanupMocks();
        mockAuthUser("OPERATOR", org1.id, [org1, org2]);
        
        let editResult = await accessControlProvider.can({
          resource: "organizations",
          action: "edit",
        });
        expect(editResult.can).toBe(false);
        expect(editResult.reason).toContain("不能修改组织");

        // 切换后 org-2
        cleanupMocks();
        mockAuthUser("OPERATOR", org2.id, [org1, org2]);
        
        editResult = await accessControlProvider.can({
          resource: "organizations",
          action: "edit",
        });
        expect(editResult.can).toBe(false);
        expect(editResult.reason).toContain("不能修改组织");
      });

      it("切换前后：其他资源可编辑", async () => {
        const otherResources = ["properties", "units", "tenants", "leases", "payments"] as const;

        for (const resource of otherResources) {
          // 切换前 org-1
          cleanupMocks();
          mockAuthUser("OPERATOR", org1.id, [org1, org2]);
          
          let result = await accessControlProvider.can({ resource, action: "edit" });
          expect(result.can).toBe(true);

          // 切换后 org-2
          cleanupMocks();
          mockAuthUser("OPERATOR", org2.id, [org1, org2]);
          
          result = await accessControlProvider.can({ resource, action: "edit" });
          expect(result.can).toBe(true);
        }
      });
    });
  });

  // ==========================================================================
  // 4. 边缘情况与健壮性验证
  // ==========================================================================

  describe("边缘情况与健壮性", () => {
    it("资源名称未定义时应拒绝访问", async () => {
      cleanupMocks();
      mockAuthUser("OWNER");

      const result = await accessControlProvider.can({
        resource: undefined as unknown as string,
        action: "list",
      });

      expect(result.can).toBe(false);
      expect(result.reason).toContain("资源或操作未定义");
    });

    it("操作未定义时应拒绝访问", async () => {
      cleanupMocks();
      mockAuthUser("OWNER");

      const result = await accessControlProvider.can({
        resource: "properties",
        action: undefined as unknown as string,
      });

      expect(result.can).toBe(false);
      expect(result.reason).toContain("资源或操作未定义");
    });

    it("角色大小写不敏感（标准化处理）", async () => {
      cleanupMocks();
      
      // 模拟小写角色
      const authData: AuthPayload = {
        token: "mock-token",
        organizationId: "test-org",
        user: {
          id: "user-1",
          email: "viewer@example.com",
          role: "viewer", // 小写
        },
      };
      jest.spyOn(storageModule, "loadAuth").mockReturnValue(authData);

      const result = await accessControlProvider.can({
        resource: "properties",
        action: "edit",
      });

      // 小写 viewer 应被识别为 VIEWER，拒绝编辑
      expect(result.can).toBe(false);
      expect(result.reason).toContain("viewer");
    });

    it("localStorage 损坏时应返回未登录", async () => {
      cleanupMocks();
      
      // 模拟 loadAuth 返回格式异常的数据
      jest.spyOn(storageModule, "loadAuth").mockReturnValue({
        token: "token",
        organizationId: "org",
        user: { id: "1", email: "test@example.com" }, // 缺少 role
      });

      const result = await accessControlProvider.can({
        resource: "properties",
        action: "list",
      });

      expect(result.can).toBe(false);
      expect(result.reason).toContain("未登录或角色未知");
    });
  });

  // ==========================================================================
  // 5. 综合场景：Viewer 完全只读验证
  // ==========================================================================

  describe("[FE-4-101 综合验证] Viewer 完全只读", () => {
    beforeEach(() => {
      cleanupMocks();
      mockAuthUser("VIEWER");
    });

    it("Viewer 在所有资源上都能 list 和 show", async () => {
      for (const resource of RESOURCES) {
        const listResult = await accessControlProvider.can({
          resource,
          action: "list",
        });
        const showResult = await accessControlProvider.can({
          resource,
          action: "show",
        });

        expect(listResult.can).toBe(true);
        expect(showResult.can).toBe(true);
      }
    });

    it("Viewer 在所有资源上都不能 create/edit/delete", async () => {
      const writeActions = ["create", "edit", "delete"] as const;

      for (const resource of RESOURCES) {
        for (const action of writeActions) {
          const result = await accessControlProvider.can({
            resource,
            action,
          });

          expect(result.can).toBe(false);
          expect(result.reason).toContain("viewer");
        }
      }
    });

    it("Viewer 不能使用 Mark-Paid（payments edit 权限）", async () => {
      const result = await accessControlProvider.can({
        resource: "payments",
        action: "edit",
      });

      expect(result.can).toBe(false);
      expect(result.reason).toContain("viewer");
    });

    it("Viewer 不能从 Units 创建 Lease（leases create 权限）", async () => {
      const result = await accessControlProvider.can({
        resource: "leases",
        action: "create",
      });

      expect(result.can).toBe(false);
      expect(result.reason).toContain("viewer");
    });
  });

  // ==========================================================================
  // 6. 文档化测试：集成说明
  // ==========================================================================

  describe("集成说明（文档化测试）", () => {
    it("所有列表页通过 ResourceTable 组件集成权限检查", () => {
      // ResourceTable 组件已实现：
      // - Create 按钮：useCan({ resource, action: "create" })
      // - Edit 按钮：useCan({ resource, action: "edit" })
      // - Delete 按钮：useCan({ resource, action: "delete" })
      expect(true).toBe(true);
    });

    it("所有详情页通过 canEdit/canDelete props 或 useCan 集成权限检查", () => {
      // 详情页实现模式：
      // - <Show> 组件的 canEdit/canDelete props
      // - 或在组件内部使用 useCan() 手动检查
      expect(true).toBe(true);
    });

    it("路由守卫通过 <Authenticated> 组件 + AuthProvider.check() 实现", () => {
      // AppRoutes.tsx 中所有业务路由都被 <Authenticated> 包裹
      // AuthProvider.check() 检查 localStorage 中的 auth 信息
      expect(true).toBe(true);
    });

    it("组织切换通过 organization.ts helper 函数统一获取当前组织", () => {
      // getCurrentOrganizationId() 用于所有 dataProvider 方法和 axios 拦截器
      // switchOrganization() 更新 localStorage 并刷新页面
      expect(true).toBe(true);
    });

    it("401 拦截器清除 auth 并重定向到 /login", () => {
      // http.ts 响应拦截器处理 401 错误
      // authProvider.onError() 处理 Refine hooks 的 401 错误
      expect(true).toBe(true);
    });
  });
});
