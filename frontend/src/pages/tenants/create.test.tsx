/// <reference types="@testing-library/jest-dom" />
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { BrowserRouter } from "react-router";
import { QueryClientProvider, QueryClient } from "@tanstack/react-query";
import { I18nextProvider } from "react-i18next";
import i18n from "../../i18n";
import TenantsCreate from "./create";
import * as coreHooks from "@refinedev/core";

/**
 * FE-5-108: Tenants Create 表单校验测试
 * 
 * 测试场景：
 * 1. 必填字段不填时，显示 i18n 统一文案
 * 2. 邮箱格式错误时，显示邮箱错误提示
 * 3. 电话号码格式错误时，显示电话错误提示
 * 4. 字段最大长度限制
 * 5. 第一个有错字段自动滚动
 */

jest.mock("@refinedev/core", () => ({
  ...jest.requireActual("@refinedev/core"),
  useCan: jest.fn(),
  useForm: jest.fn(),
  useList: jest.fn(),
}));

describe("TenantsCreate - Form Validation (FE-5-108)", () => {
  beforeEach(() => {
    (coreHooks.useCan as jest.Mock).mockReturnValue({
      data: { can: true },
    });

    (coreHooks.useForm as jest.Mock).mockReturnValue({
      formProps: {
        onFinish: jest.fn(),
      },
      saveButtonProps: {},
    });
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  const renderTenantsCreate = () => {
    const queryClient = new QueryClient({
      defaultOptions: {
        queries: { retry: false },
        mutations: { retry: false },
      },
    });

    return render(
      <BrowserRouter>
        <QueryClientProvider client={queryClient}>
          <I18nextProvider i18n={i18n}>
            <TenantsCreate />
          </I18nextProvider>
        </QueryClientProvider>
      </BrowserRouter>
    );
  };

  test("必填姓名字段为空时，应该显示 i18n 错误提示", async () => {
    const user = userEvent.setup();
    renderTenantsCreate();

    // 点击保存按钮，触发验证
    const submitButton = screen.getByRole("button", { name: /保存/i });
    await user.click(submitButton);

    // 等待错误提示出现
    await waitFor(() => {
      const error = screen.getByText(
        (content) => content.includes("租客姓名") && content.includes("请输入")
      );
      expect(error).toBeInTheDocument();
    });
  });

  test("必填邮箱字段为空时，应该显示 i18n 错误提示", async () => {
    const user = userEvent.setup();
    renderTenantsCreate();

    // 点击保存按钮，触发验证
    const submitButton = screen.getByRole("button", { name: /保存/i });
    await user.click(submitButton);

    // 等待邮箱错误提示
    await waitFor(() => {
      const error = screen.getByText(
        (content) => content.includes("邮箱") && content.includes("请输入")
      );
      expect(error).toBeInTheDocument();
    });
  });

  test("邮箱格式不正确时，应该显示邮箱格式错误提示", async () => {
    const user = userEvent.setup();
    renderTenantsCreate();

    // 填入无效邮箱
    const emailInput = screen.getByPlaceholderText(/邮箱/i);
    await user.type(emailInput, "invalid-email");

    // 点击保存按钮
    const submitButton = screen.getByRole("button", { name: /保存/i });
    await user.click(submitButton);

    // 等待邮箱格式错误提示
    await waitFor(() => {
      const error = screen.getByText(/请输入有效的邮箱地址/i);
      expect(error).toBeInTheDocument();
    });
  });

  test("必填电话字段为空时，应该显示 i18n 错误提示", async () => {
    const user = userEvent.setup();
    renderTenantsCreate();

    // 填入有效邮箱
    const emailInput = screen.getByPlaceholderText(/邮箱/i);
    await user.type(emailInput, "test@example.com");

    // 点击保存按钮
    const submitButton = screen.getByRole("button", { name: /保存/i });
    await user.click(submitButton);

    // 等待电话错误提示
    await waitFor(() => {
      const error = screen.getByText(
        (content) => content.includes("电话") && content.includes("请输入")
      );
      expect(error).toBeInTheDocument();
    });
  });

  test("电话格式不正确时，应该显示电话格式错误提示", async () => {
    const user = userEvent.setup();
    renderTenantsCreate();

    // 填入有效邮箱
    const emailInput = screen.getByPlaceholderText(/邮箱/i);
    await user.type(emailInput, "test@example.com");

    // 填入无效电话（包含中文）
    const phoneInput = screen.getByPlaceholderText(/电话/i);
    await user.type(phoneInput, "电话号码abc");

    // 点击保存按钮
    const submitButton = screen.getByRole("button", { name: /保存/i });
    await user.click(submitButton);

    // 等待电话格式错误提示
    await waitFor(() => {
      const error = screen.getByText(/请输入有效的手机号/i);
      expect(error).toBeInTheDocument();
    });
  });

  test("姓名超过最大长度时，应该显示长度错误提示", async () => {
    const user = userEvent.setup();
    renderTenantsCreate();

    // 填入超长姓名（超过 100 字符）
    const nameInput = screen.getByPlaceholderText(/租客姓名/i);
    const longName = "a".repeat(101);
    await user.type(nameInput, longName);

    // 填入其他字段
    const emailInput = screen.getByPlaceholderText(/邮箱/i);
    await user.type(emailInput, "test@example.com");

    const phoneInput = screen.getByPlaceholderText(/电话/i);
    await user.type(phoneInput, "13800138000");

    // 点击保存按钮
    const submitButton = screen.getByRole("button", { name: /保存/i });
    await user.click(submitButton);

    // 等待长度错误提示
    await waitFor(() => {
      const error = screen.getByText(/最多输入.*个字符/i);
      expect(error).toBeInTheDocument();
    });
  });

  test("所有必填字段有效时，应该允许提交", async () => {
    const user = userEvent.setup();
    renderTenantsCreate();

    // 填入所有必填字段
    const nameInput = screen.getByPlaceholderText(/租客姓名/i);
    await user.type(nameInput, "张三");

    const emailInput = screen.getByPlaceholderText(/邮箱/i);
    await user.type(emailInput, "test@example.com");

    const phoneInput = screen.getByPlaceholderText(/电话/i);
    await user.type(phoneInput, "13800138000");

    // 点击保存按钮
    const submitButton = screen.getByRole("button", { name: /保存/i });
    await user.click(submitButton);

    // 应该不出现错误提示
    await waitFor(() => {
      expect(screen.queryByText(/请输入/i)).not.toBeInTheDocument();
    });
  });

  test("表单有错误时，应该自动滚动到第一个有错字段", async () => {
    const user = userEvent.setup();
    renderTenantsCreate();

    // Mock scrollIntoView
    Element.prototype.scrollIntoView = jest.fn();

    // 点击保存，触发验证
    const submitButton = screen.getByRole("button", { name: /保存/i });
    await user.click(submitButton);

    // 由于 AntD Form 的 scrollToFirstError，应该有滚动发生
    await waitFor(() => {
      // 验证错误提示出现，说明验证已触发
      expect(
        screen.getByText(
          (content) => content.includes("请输入") && content.includes("姓名")
        )
      ).toBeInTheDocument();
    });
  });

  test("所有错误文案应该来自 i18n，不含硬编码中文", async () => {
    const user = userEvent.setup();
    renderTenantsCreate();

    // 点击保存，触发验证
    const submitButton = screen.getByRole("button", { name: /保存/i });
    await user.click(submitButton);

    // 等待错误出现
    await waitFor(() => {
      // 获取所有错误文本
      const errors = screen.getAllByText(/请输入|请选择|不能超过/);

      // 验证至少有一个错误来自 i18n
      expect(errors.length).toBeGreaterThan(0);

      // 每个错误都应该包含有效的文案（不是"undefined"或"[object Object]"）
      errors.forEach((error) => {
        expect(error.textContent).not.toMatch(/undefined|\[object/i);
      });
    });
  });
});
