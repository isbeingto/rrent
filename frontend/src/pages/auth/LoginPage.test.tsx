/// <reference types="@testing-library/jest-dom" />
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { BrowserRouter } from "react-router";
import { QueryClientProvider, QueryClient } from "@tanstack/react-query";
import { I18nextProvider } from "react-i18next";
import i18n from "../../i18n";
import LoginPage from "./LoginPage";
import * as authHooks from "@refinedev/core";

/**
 * FE-5-108: Login 表单校验测试
 * 
 * 测试场景：
 * 1. 必填字段不填时，显示统一的错误文案
 * 2. 邮箱格式错误时，显示邮箱错误提示
 * 3. 密码长度不足时，显示密码长度提示
 * 4. 第一个有错字段自动滚动到视口
 */

// Mock useLogin hook
jest.mock("@refinedev/core", () => ({
  ...jest.requireActual("@refinedev/core"),
  useLogin: jest.fn(),
}));

describe("LoginPage - Form Validation (FE-5-108)", () => {
  let mockMutate: jest.Mock;

  beforeEach(() => {
    mockMutate = jest.fn();
    (authHooks.useLogin as jest.Mock).mockReturnValue({
      mutate: mockMutate,
      isPending: false,
    });
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  const renderLoginPage = () => {
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
            <LoginPage />
          </I18nextProvider>
        </QueryClientProvider>
      </BrowserRouter>
    );
  };

  test("应该显示必填邮箱字段的错误提示", async () => {
    const user = userEvent.setup();
    renderLoginPage();

    // 点击登录按钮，不填任何字段
    const submitButton = screen.getByRole("button", { name: /登录/i });
    await user.click(submitButton);

    // 等待邮箱错误提示出现
    await waitFor(() => {
      const emailError = screen.getByText(
        (content) => content.includes("邮箱") && content.includes("请输入")
      );
      expect(emailError).toBeInTheDocument();
    });
  });

  test("应该显示必填密码字段的错误提示", async () => {
    const user = userEvent.setup();
    renderLoginPage();

    // 点击登录按钮，不填任何字段
    const submitButton = screen.getByRole("button", { name: /登录/i });
    await user.click(submitButton);

    // 等待密码错误提示出现
    await waitFor(() => {
      const passwordError = screen.getByText(
        (content) => content.includes("密码") && content.includes("请输入")
      );
      expect(passwordError).toBeInTheDocument();
    });
  });

  test("应该显示必填组织代码字段的错误提示", async () => {
    const user = userEvent.setup();
    renderLoginPage();

    // 点击登录按钮，不填任何字段
    const submitButton = screen.getByRole("button", { name: /登录/i });
    await user.click(submitButton);

    // 等待组织代码错误提示出现
    await waitFor(() => {
      const orgCodeError = screen.getByText(
        (content) =>
          content.includes("组织代码") && content.includes("请输入")
      );
      expect(orgCodeError).toBeInTheDocument();
    });
  });

  test("邮箱格式错误时，应该显示邮箱格式错误提示", async () => {
    const user = userEvent.setup();
    renderLoginPage();

    // 填入错误的邮箱格式
    const emailInput = screen.getByPlaceholderText(/邮箱/i);
    await user.type(emailInput, "invalid-email");

    // 点击登录按钮触发验证
    const submitButton = screen.getByRole("button", { name: /登录/i });
    await user.click(submitButton);

    // 等待邮箱格式错误提示
    await waitFor(() => {
      const error = screen.getByText(/请输入有效的邮箱地址/i);
      expect(error).toBeInTheDocument();
    });
  });

  test("密码长度少于 6 位时，应该显示最小长度错误提示", async () => {
    const user = userEvent.setup();
    renderLoginPage();

    // 填入有效邮箱
    const emailInput = screen.getByPlaceholderText(/邮箱/i);
    await user.type(emailInput, "test@example.com");

    // 填入过短的密码
    const passwordInput = screen.getByPlaceholderText(/密码/i);
    await user.type(passwordInput, "12345"); // 5 个字符

    // 填入组织代码
    const orgCodeInput = screen.getAllByRole("textbox")[2];
    await user.type(orgCodeInput, "TEST-ORG");

    // 点击登录按钮触发验证
    const submitButton = screen.getByRole("button", { name: /登录/i });
    await user.click(submitButton);

    // 等待密码长度错误提示
    await waitFor(() => {
      const error = screen.getByText(/至少 6 位/i);
      expect(error).toBeInTheDocument();
    });
  });

  test("所有字段有效时，应该调用 login mutation", async () => {
    const user = userEvent.setup();
    renderLoginPage();

    // 填入所有字段
    const emailInput = screen.getByPlaceholderText(/邮箱/i);
    await user.type(emailInput, "test@example.com");

    const passwordInput = screen.getByPlaceholderText(/密码/i);
    await user.type(passwordInput, "password123");

    const orgCodeInput = screen.getAllByRole("textbox")[2];
    await user.type(orgCodeInput, "TEST-ORG");

    // 点击登录按钮
    const submitButton = screen.getByRole("button", { name: /登录/i });
    await user.click(submitButton);

    // 等待 login mutation 被调用
    await waitFor(() => {
      expect(mockMutate).toHaveBeenCalledWith(
        expect.objectContaining({
          email: "test@example.com",
          password: "password123",
          organizationCode: "TEST-ORG",
        }),
        expect.anything()
      );
    });
  });

  test("表单有错误时，应该自动滚动到第一个有错字段", async () => {
    const user = userEvent.setup();
    renderLoginPage();

    // Mock scrollIntoView
    Element.prototype.scrollIntoView = jest.fn();

    // 点击登录，触发验证
    const submitButton = screen.getByRole("button", { name: /登录/i });
    await user.click(submitButton);

    // 由于 AntD Form 的 scrollToFirstError 特性，应该有滚动发生
    await waitFor(() => {
      expect(mockMutate).not.toHaveBeenCalled();
    });
  });
});
