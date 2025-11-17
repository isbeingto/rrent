import { Card, Form, Input, Button, Layout, message } from "antd";
import { useLogin } from "@refinedev/core";

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
        message.success("登录成功");
      },
      onError: (error) => {
        // 显示错误消息
        const errorMessage =
          (error as { message?: string })?.message || "登录失败，请检查您的凭据";
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
            requiredMark="optional"
          >
            {/* 邮箱字段 */}
            <Form.Item
              name="email"
              label="邮箱"
              rules={[
                { required: true, message: "请输入邮箱地址" },
                {
                  type: "email",
                  message: "请输入正确的邮箱地址",
                },
              ]}
            >
              <Input placeholder="请输入邮箱" type="email" />
            </Form.Item>

            {/* 密码字段 */}
            <Form.Item
              name="password"
              label="密码"
              rules={[
                { required: true, message: "请输入密码" },
                {
                  min: 6,
                  message: "密码长度至少 6 位",
                },
              ]}
            >
              <Input.Password placeholder="请输入密码（至少 6 位）" />
            </Form.Item>

            {/* 组织代码字段 */}
            <Form.Item
              name="organizationCode"
              label="组织代码"
              rules={[{ required: true, message: "请输入组织代码" }]}
            >
              <Input placeholder="请输入组织代码" />
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
