import { Card, Form, Input, Button, Layout, message } from "antd";
import { useState } from "react";

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
 * TODO(FE-1-Auth): 将此处替换为真实 /auth/login API 调用与 Token 处理
 */
export default function LoginPage() {
  const [form] = Form.useForm<LoginFormValues>();
  const [loading, setLoading] = useState(false);

  /**
   * 处理登录提交
   * 当前为占位逻辑，仅打印表单值和显示成功消息
   */
  const handleLogin = async (values: LoginFormValues) => {
    try {
      setLoading(true);
      // TODO(FE-1-Auth): 将此处替换为真实 /auth/login API 调用与 Token 处理
      console.log("[LOGIN_STUB]", values);
      message.success("登录请求已发送（当前为占位逻辑）");
      // 占位逻辑结束
    } catch {
      message.error("登录失败，请稍后重试");
    } finally {
      setLoading(false);
    }
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
              <Button type="primary" htmlType="submit" block loading={loading}>
                登录
              </Button>
            </Form.Item>
          </Form>
        </Card>
      </Content>
    </Layout>
  );
}
