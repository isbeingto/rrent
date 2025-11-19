import { Card, Form, Input, Button, Layout, message } from "antd";
import { useLogin } from "@refinedev/core";
import { useTranslation } from "react-i18next";
import {
  buildRequiredRule,
  buildEmailRule,
  buildPasswordRule,
} from "../../shared/validation/rules";

const { Content } = Layout;

interface LoginFormValues {
  email: string;
  password: string;
  organizationCode: string;
}

/**
 * 登录页组件
 *
 * 提供 AntD 表单，包含邮箱、密码、组织代码三个字段
 * 表单校验：
 * - email: 必填，格式校验
 * - password: 必填，最少 6 位
 * - organizationCode: 必填
 *
 * FE-1-78: 已接入真实 authProvider.login
 */
export default function LoginPage() {
  const { t } = useTranslation();
  const [form] = Form.useForm<LoginFormValues>();
  const { mutate: login, isPending } = useLogin<LoginFormValues>();

  /**
   * 处理登录提交
   * 使用 Refine 的 useLogin hook 调用 authProvider.login
   */
  const handleLogin = async (values: LoginFormValues) => {
    login(values, {
      onSuccess: () => {
        // Refine 会自动处理 redirectTo
        message.success(t("common:form.success", { defaultValue: "登录成功" }));
      },
      onError: (error) => {
        // 显示错误消息，使用统一的文案
        const errorMessage =
          (error as { message?: string })?.message ||
          t("common:form.submitFailed");
        message.error(errorMessage);
      },
    });
  };

  return (
    <Layout
      style={{
        minHeight: "100vh",
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
      }}
    >
      <Content
        style={{
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          width: "100%",
        }}
      >
        <Card
          title="登录"
          style={{
            width: "100%",
            maxWidth: "400px",
            boxShadow: "0 2px 8px rgba(0, 0, 0, 0.1)",
          }}
        >
          <Form<LoginFormValues>
            form={form}
            layout="vertical"
            onFinish={handleLogin}
            scrollToFirstError
            requiredMark="optional"
          >
            {/* 邮箱字段 */}
            <Form.Item
              name="email"
              label={t("common:fields.email")}
              rules={[buildRequiredRule(t, "email"), buildEmailRule(t)]}
            >
              <Input
                placeholder={t("common:fields.email")}
                type="email"
              />
            </Form.Item>

            {/* 密码字段 */}
            <Form.Item
              name="password"
              label={t("common:fields.password")}
              rules={[buildRequiredRule(t, "password"), buildPasswordRule(t)]}
            >
              <Input.Password
                placeholder={t("common:fields.password")}
              />
            </Form.Item>

            {/* 组织代码字段 */}
            <Form.Item
              name="organizationCode"
              label={t("common:fields.organizationCode")}
              rules={[buildRequiredRule(t, "organizationCode")]}
            >
              <Input placeholder={t("common:fields.organizationCode")} />
            </Form.Item>

            {/* 登录按钮 */}
            <Form.Item>
              <Button type="primary" htmlType="submit" block loading={isPending}>
                登录
              </Button>
            </Form.Item>
          </Form>
        </Card>
      </Content>
    </Layout>
  );
}
