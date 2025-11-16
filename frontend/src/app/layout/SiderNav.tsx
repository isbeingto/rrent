import { Menu } from "antd";
import { useLocation, useNavigate } from "react-router";
import { NAV_ITEMS } from "@shared/nav";
import type { MenuProps } from "antd";

interface SiderNavProps {
  collapsed?: boolean;
}

/**
 * 侧边栏导航组件
 *
 * 从 NAV_ITEMS 读取菜单项配置，支持禁用态与路由跳转
 */
export default function SiderNav({ collapsed }: SiderNavProps) {
  const location = useLocation();
  const navigate = useNavigate();

  // 根据当前路由计算选中的菜单项
  const selectedKeys = NAV_ITEMS.filter(
    (item) => item.to && location.pathname === item.to
  ).map((item) => item.key);

  // 默认选中 dashboard（当路径为根路径时）
  const finalSelectedKeys =
    selectedKeys.length > 0 ? selectedKeys : ["dashboard"];

  // 生成 Menu items
  const menuItems: MenuProps["items"] = NAV_ITEMS.map((item) => ({
    key: item.key,
    icon: item.icon,
    label: item.label,
    disabled: item.disabled,
    onClick: () => {
      if (!item.disabled && item.to) {
        navigate(item.to);
      }
    },
  }));

  return (
    <Menu
      mode="inline"
      selectedKeys={finalSelectedKeys}
      items={menuItems}
      inlineCollapsed={collapsed}
      style={{ height: "100%", borderRight: 0 }}
    />
  );
}
