import { useState } from "react";
import { Layout, Typography, Breadcrumb, Button, theme } from "antd";
import { MenuFoldOutlined, MenuUnfoldOutlined } from "@ant-design/icons";
import { Outlet, useLocation } from "react-router";
import SiderNav from "./SiderNav";
import { NAV_ITEMS } from "@shared/nav";

const { Header, Sider, Content } = Layout;
const { Title } = Typography;

/**
 * 主布局组件
 *
 * 三段式布局：Header（顶栏） + Sider（侧栏） + Content（内容区 + 面包屑）
 * 支持响应式折叠与手动折叠
 */
export default function MainLayout() {
  const [collapsed, setCollapsed] = useState(false);
  const location = useLocation();
  const {
    token: { colorBgContainer, borderRadiusLG },
  } = theme.useToken();

  // 获取应用名称（从环境变量或默认值）
  const appName = import.meta.env.VITE_APP_NAME || "rrent";

  // 根据当前路径生成面包屑
  const breadcrumbItems = [];
  const currentPath = location.pathname;

  if (currentPath === "/") {
    breadcrumbItems.push({ title: "Dashboard" });
  } else {
    const navItem = NAV_ITEMS.find((item) => item.to === currentPath);
    if (navItem) {
      breadcrumbItems.push({ title: navItem.label });
    } else {
      breadcrumbItems.push({ title: "404" });
    }
  }

  return (
    <Layout style={{ minHeight: "100vh" }}>
      {/* 侧边栏 */}
      <Sider
        collapsible
        collapsed={collapsed}
        onCollapse={setCollapsed}
        breakpoint="lg"
        collapsedWidth={64}
        width={240}
        style={{
          overflow: "auto",
          height: "100vh",
          position: "fixed",
          left: 0,
          top: 0,
          bottom: 0,
        }}
      >
        {/* Logo 区域 */}
        <div
          style={{
            height: 64,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            color: "#fff",
            fontSize: collapsed ? 16 : 20,
            fontWeight: "bold",
          }}
        >
          {collapsed ? "R" : appName}
        </div>
        <SiderNav collapsed={collapsed} />
      </Sider>

      {/* 右侧布局 */}
      <Layout
        style={{
          marginLeft: collapsed ? 64 : 240,
          transition: "margin-left 0.2s",
        }}
      >
        {/* 顶栏 */}
        <Header
          style={{
            padding: "0 24px",
            background: colorBgContainer,
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            position: "sticky",
            top: 0,
            zIndex: 1,
            boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
            <Button
              type="text"
              icon={collapsed ? <MenuUnfoldOutlined /> : <MenuFoldOutlined />}
              onClick={() => setCollapsed(!collapsed)}
              style={{ fontSize: "16px", width: 40, height: 40 }}
            />
            <Title level={4} style={{ margin: 0 }}>
              {appName}
            </Title>
          </div>
          {/* 用户区占位 */}
          <div
            id="user-slot"
            style={{ display: "flex", alignItems: "center", gap: "16px" }}
          >
            {/* FE-0-72 接入用户信息与退出登录 */}
          </div>
        </Header>

        {/* 内容区 */}
        <Content style={{ margin: "16px", overflow: "initial" }}>
          {/* 面包屑 */}
          <Breadcrumb
            style={{ marginBottom: "16px" }}
            items={breadcrumbItems}
          />

          {/* 页面内容 */}
          <div
            style={{
              padding: 24,
              minHeight: 360,
              background: colorBgContainer,
              borderRadius: borderRadiusLG,
            }}
          >
            <Outlet />
          </div>
        </Content>
      </Layout>
    </Layout>
  );
}
