/**
 * FE-4-100: 菜单可见性测试
 * 
 * 测试 SiderNav 组件根据 AccessControlProvider 的权限结果
 * 正确显示或隐藏菜单项
 */

import "@testing-library/jest-dom";
import { render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter } from "react-router";
import { Refine } from "@refinedev/core";
import SiderNav from "../SiderNav";
import * as storageModule from "@shared/auth/storage";
import { accessControlProvider } from "@providers/accessControlProvider";
import type { AuthPayload } from "@shared/auth/storage";

// Mock dataProvider（菜单组件不需要真实的 dataProvider）
const mockDataProvider = {
  getList: jest.fn(),
  getOne: jest.fn(),
  create: jest.fn(),
  update: jest.fn(),
  deleteOne: jest.fn(),
  getApiUrl: jest.fn(() => "http://localhost:3000"),
};

/**
 * 辅助函数：模拟用户登录状态
 */
function mockAuthUser(role: string) {
  const authData: AuthPayload = {
    token: "mock-token",
    organizationId: "test-org",
    user: {
      id: "user-1",
      email: `${role.toLowerCase()}@example.com`,
      fullName: role,
      role: role,
    },
  };
  jest.spyOn(storageModule, "loadAuth").mockReturnValue(authData);
}

/**
 * 辅助函数：模拟未登录状态
 */
function mockNoAuth() {
  jest.spyOn(storageModule, "loadAuth").mockReturnValue(null);
}

/**
 * 辅助函数：渲染 SiderNav（包装在 Refine 上下文中）
 */
function renderSiderNav() {
  return render(
    <MemoryRouter>
      <Refine
        dataProvider={mockDataProvider}
        accessControlProvider={accessControlProvider}
        resources={[
          { name: "organizations", list: "/organizations" },
          { name: "properties", list: "/properties" },
          { name: "units", list: "/units" },
          { name: "tenants", list: "/tenants" },
          { name: "leases", list: "/leases" },
          { name: "payments", list: "/payments" },
        ]}
      >
        <SiderNav />
      </Refine>
    </MemoryRouter>
  );
}

describe("SiderNav - 菜单可见性（基于 AccessControlProvider）", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe("未登录状态", () => {
    it("应只显示 Dashboard，不显示业务资源菜单", async () => {
      mockNoAuth();
      renderSiderNav();

      // Dashboard 应该可见
      await waitFor(() => {
        expect(screen.getByText("Dashboard")).toBeInTheDocument();
      });

      // 业务资源菜单不应该出现
      expect(screen.queryByText("Organizations")).not.toBeInTheDocument();
      expect(screen.queryByText("Properties")).not.toBeInTheDocument();
      expect(screen.queryByText("Units")).not.toBeInTheDocument();
      expect(screen.queryByText("Tenants")).not.toBeInTheDocument();
      expect(screen.queryByText("Leases")).not.toBeInTheDocument();
      expect(screen.queryByText("Payments")).not.toBeInTheDocument();
    });
  });

  describe("OWNER 角色", () => {
    it("应显示所有资源菜单（包括 Organizations）", async () => {
      mockAuthUser("OWNER");
      renderSiderNav();

      // 等待所有菜单项出现
      await waitFor(() => {
        expect(screen.getByText("Dashboard")).toBeInTheDocument();
        expect(screen.getByText("Organizations")).toBeInTheDocument();
        expect(screen.getByText("Properties")).toBeInTheDocument();
        expect(screen.getByText("Units")).toBeInTheDocument();
        expect(screen.getByText("Tenants")).toBeInTheDocument();
        expect(screen.getByText("Leases")).toBeInTheDocument();
        expect(screen.getByText("Payments")).toBeInTheDocument();
      }, { timeout: 10000 });
    });
  });

  describe("ADMIN 角色", () => {
    it("应显示所有资源菜单", async () => {
      mockAuthUser("ADMIN");
      renderSiderNav();

      await waitFor(() => {
        expect(screen.getByText("Dashboard")).toBeInTheDocument();
        expect(screen.getByText("Organizations")).toBeInTheDocument();
        expect(screen.getByText("Properties")).toBeInTheDocument();
        expect(screen.getByText("Units")).toBeInTheDocument();
        expect(screen.getByText("Tenants")).toBeInTheDocument();
        expect(screen.getByText("Leases")).toBeInTheDocument();
        expect(screen.getByText("Payments")).toBeInTheDocument();
      }, { timeout: 10000 });
    });
  });

  describe("OPERATOR 角色", () => {
    it("应显示所有资源菜单（包括只读的 Organizations）", async () => {
      mockAuthUser("OPERATOR");
      renderSiderNav();

      // OPERATOR 可以 list 所有资源（包括 Organizations）
      await waitFor(() => {
        expect(screen.getByText("Dashboard")).toBeInTheDocument();
        expect(screen.getByText("Organizations")).toBeInTheDocument();
        expect(screen.getByText("Properties")).toBeInTheDocument();
        expect(screen.getByText("Units")).toBeInTheDocument();
        expect(screen.getByText("Tenants")).toBeInTheDocument();
        expect(screen.getByText("Leases")).toBeInTheDocument();
        expect(screen.getByText("Payments")).toBeInTheDocument();
      });
    });
  });

  describe("STAFF 角色", () => {
    it("应显示所有资源菜单（与 OPERATOR 权限相同）", async () => {
      mockAuthUser("STAFF");
      renderSiderNav();

      await waitFor(() => {
        expect(screen.getByText("Dashboard")).toBeInTheDocument();
        expect(screen.getByText("Organizations")).toBeInTheDocument();
        expect(screen.getByText("Properties")).toBeInTheDocument();
        expect(screen.getByText("Units")).toBeInTheDocument();
        expect(screen.getByText("Tenants")).toBeInTheDocument();
        expect(screen.getByText("Leases")).toBeInTheDocument();
        expect(screen.getByText("Payments")).toBeInTheDocument();
      }, { timeout: 10000 });
    });
  });

  describe("VIEWER 角色", () => {
    it("应显示所有资源菜单（VIEWER 可以 list）", async () => {
      mockAuthUser("VIEWER");
      renderSiderNav();

      // VIEWER 有 list/show 权限，所以所有资源菜单都应该可见
      await waitFor(() => {
        expect(screen.getByText("Dashboard")).toBeInTheDocument();
        expect(screen.getByText("Organizations")).toBeInTheDocument();
        expect(screen.getByText("Properties")).toBeInTheDocument();
        expect(screen.getByText("Units")).toBeInTheDocument();
        expect(screen.getByText("Tenants")).toBeInTheDocument();
        expect(screen.getByText("Leases")).toBeInTheDocument();
        expect(screen.getByText("Payments")).toBeInTheDocument();
      }, { timeout: 10000 });
    });
  });

  describe("未知角色", () => {
    it("应只显示 Dashboard", async () => {
      mockAuthUser("UNKNOWN");
      renderSiderNav();

      await waitFor(() => {
        expect(screen.getByText("Dashboard")).toBeInTheDocument();
      });

      // 业务资源菜单不应该出现
      expect(screen.queryByText("Organizations")).not.toBeInTheDocument();
      expect(screen.queryByText("Properties")).not.toBeInTheDocument();
      expect(screen.queryByText("Units")).not.toBeInTheDocument();
      expect(screen.queryByText("Tenants")).not.toBeInTheDocument();
      expect(screen.queryByText("Leases")).not.toBeInTheDocument();
      expect(screen.queryByText("Payments")).not.toBeInTheDocument();
    });
  });
});
