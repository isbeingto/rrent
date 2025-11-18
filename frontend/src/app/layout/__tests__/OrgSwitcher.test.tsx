/**
 * OrgSwitcher 组件测试
 * 
 * FE-4-103: 测试组织切换器的渲染和行为
 * - 单组织用户：不渲染
 * - 多组织用户：渲染下拉选择器
 * - 切换组织：更新 localStorage 并触发缓存清除
 */

import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import OrgSwitcher from "../OrgSwitcher";
import * as authStorage from "../../../shared/auth/storage";
import * as authOrganization from "../../../shared/auth/organization";

// Mock Refine hooks
jest.mock("@refinedev/core", () => ({
  useInvalidate: () => jest.fn(),
}));

describe("OrgSwitcher", () => {
  beforeEach(() => {
    // 清除 localStorage
    localStorage.clear();
    // 重置所有 mock
    jest.clearAllMocks();
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe("单组织用户", () => {
    it("当用户只有一个组织时不显示任何内容", () => {
      // Mock: 用户只有一个组织
      jest.spyOn(authOrganization, "hasMultipleOrganizations").mockReturnValue(false);
      jest.spyOn(authOrganization, "getUserOrganizations").mockReturnValue([
        { id: "org1", name: "Organization 1" },
      ]);
      jest.spyOn(authOrganization, "getCurrentOrganizationId").mockReturnValue("org1");
      
      const { container } = render(<OrgSwitcher />);

      // 不应该渲染任何内容
      expect(container.firstChild).toBeNull();
    });

    it("当用户没有组织信息时不显示任何内容", () => {
      // Mock: 没有组织信息
      jest.spyOn(authOrganization, "hasMultipleOrganizations").mockReturnValue(false);
      jest.spyOn(authOrganization, "getUserOrganizations").mockReturnValue([]);
      jest.spyOn(authOrganization, "getCurrentOrganizationId").mockReturnValue(null);
      
      const { container } = render(<OrgSwitcher />);

      // 不应该渲染任何内容
      expect(container.firstChild).toBeNull();
    });
  });

  describe("多组织用户", () => {
    const mockOrganizations = [
      { id: "orgA", name: "Organization A", code: "ORG_A" },
      { id: "orgB", name: "Organization B", code: "ORG_B" },
    ];

    it("当用户有多个组织时显示选择器", () => {
      jest.spyOn(authOrganization, "hasMultipleOrganizations").mockReturnValue(true);
      jest.spyOn(authOrganization, "getUserOrganizations").mockReturnValue(mockOrganizations);
      jest.spyOn(authOrganization, "getCurrentOrganizationId").mockReturnValue("orgA");
      
      render(<OrgSwitcher />);

      // 应该渲染一个 Select 组件
      const select = screen.getByRole("combobox");
      expect(select).toBeTruthy();
    });

    it("切换组织时调用 switchOrganization", async () => {
      // Mock switchOrganization
      const switchOrgSpy = jest.spyOn(authStorage, "switchOrganization").mockImplementation(() => {});
      // Mock window.location.reload
      const reloadSpy = jest.fn();
      Object.defineProperty(window, "location", {
        value: { reload: reloadSpy },
        writable: true,
      });
      jest.spyOn(authOrganization, "hasMultipleOrganizations").mockReturnValue(true);
      jest.spyOn(authOrganization, "getUserOrganizations").mockReturnValue(mockOrganizations);
      jest.spyOn(authOrganization, "getCurrentOrganizationId").mockReturnValue("orgA");
      
      render(<OrgSwitcher />);

      const select = screen.getByRole("combobox");
      
      // 点击选择器打开下拉菜单
      fireEvent.mouseDown(select);

      await waitFor(() => {
        // 查找 Organization B 选项
        const optionB = screen.queryByText("Organization B");
        expect(optionB).toBeTruthy();
      });

      // 点击 Organization B
      const optionB = screen.getByText("Organization B");
      fireEvent.click(optionB);

      await waitFor(() => {
        // 验证 switchOrganization 被调用
        expect(switchOrgSpy).toHaveBeenCalledWith("orgB", "ORG_B");
      });
    });
  });

  describe("localStorage 持久化", () => {
    it("切换组织后 localStorage 中的 auth 数据应该更新", () => {
      // 准备初始 auth 数据
      const initialAuth: authStorage.AuthPayload = {
        token: "test-token",
        organizationId: "orgA",
        organizationCode: "ORG_A",
        user: {
          id: "user1",
          email: "test@example.com",
          organizations: [
            { id: "orgA", name: "Organization A", code: "ORG_A" },
            { id: "orgB", name: "Organization B", code: "ORG_B" },
          ],
        },
      };

      authStorage.saveAuth(initialAuth);

      // 切换到 orgB
      authStorage.switchOrganization("orgB", "ORG_B");

      // 验证 localStorage 更新
      const updatedAuth = authStorage.loadAuth();
      expect(updatedAuth?.organizationId).toBe("orgB");
      expect(updatedAuth?.organizationCode).toBe("ORG_B");
      
      // 其他字段应该保持不变
      expect(updatedAuth?.token).toBe("test-token");
      expect(updatedAuth?.user.id).toBe("user1");
    });

    it("尝试切换到不存在的组织时应该警告并不更新", () => {
      const consoleWarnSpy = jest.spyOn(console, "warn").mockImplementation(() => {});
      const initialAuth: authStorage.AuthPayload = {
        token: "test-token",
        organizationId: "orgA",
        user: {
          id: "user1",
          email: "test@example.com",
          organizations: [
            { id: "orgA", name: "Organization A" },
          ],
        },
      };

      authStorage.saveAuth(initialAuth);

      // 尝试切换到不存在的组织
      authStorage.switchOrganization("orgX", "ORG_X");

      // 验证警告被输出
      expect(consoleWarnSpy).toHaveBeenCalledWith(
        expect.stringContaining("Organization orgX not found")
      );

      // 验证组织没有变化
      const auth = authStorage.loadAuth();
      expect(auth?.organizationId).toBe("orgA");

      consoleWarnSpy.mockRestore();
    });
  });
});
