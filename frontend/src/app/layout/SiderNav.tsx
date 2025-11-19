import { useMemo } from "react";
import { Menu } from "antd";
import { useLocation, useNavigate } from "react-router";
import { useCan } from "@refinedev/core";
import { useTranslation } from "react-i18next";
import { NAV_ITEMS } from "@shared/nav";
import type { MenuProps } from "antd";

interface SiderNavProps {
  collapsed?: boolean;
}

/**
 * 侧边栏导航组件
 *
 * FE-4-100: 集成 AccessControlProvider，根据用户权限过滤菜单
 * - Dashboard 始终可见
 * - 其他资源菜单根据 can({ resource, action: "list" }) 决定可见性
 * - 不允许 list 的资源菜单将被完全隐藏
 */
export default function SiderNav({ collapsed }: SiderNavProps) {
  const { t } = useTranslation();
  const location = useLocation();
  const navigate = useNavigate();

  // 对每个资源检查 list 权限（除了 dashboard）
  const organizationsAccess = useCan({ resource: "organizations", action: "list" });
  const propertiesAccess = useCan({ resource: "properties", action: "list" });
  const unitsAccess = useCan({ resource: "units", action: "list" });
  const tenantsAccess = useCan({ resource: "tenants", action: "list" });
  const leasesAccess = useCan({ resource: "leases", action: "list" });
  const paymentsAccess = useCan({ resource: "payments", action: "list" });

  // 根据权限过滤菜单项
  const filteredNavItems = useMemo(() => {
    const accessMap: Record<string, { data?: { can: boolean } }> = {
      organizations: organizationsAccess,
      properties: propertiesAccess,
      units: unitsAccess,
      tenants: tenantsAccess,
      leases: leasesAccess,
      payments: paymentsAccess,
    };

    return NAV_ITEMS.filter((item) => {
      // Dashboard 始终可见
      if (item.key === "dashboard") {
        return true;
      }

      // 检查该资源的 list 权限
      const access = accessMap[item.key];
      if (!access || !access.data) {
        // 权限未加载或未定义，暂时隐藏
        return false;
      }

      return access.data.can;
    });
  }, [
    organizationsAccess,
    propertiesAccess,
    unitsAccess,
    tenantsAccess,
    leasesAccess,
    paymentsAccess,
  ]);

  // 根据当前路由计算选中的菜单项
  const selectedKeys = filteredNavItems
    .filter((item) => item.to && location.pathname === item.to)
    .map((item) => item.key);

  // 默认选中 dashboard（当路径为根路径时）
  const finalSelectedKeys =
    selectedKeys.length > 0 ? selectedKeys : ["dashboard"];

  // 生成 Menu items
  const menuItems: MenuProps["items"] = filteredNavItems.map((item) => ({
    key: item.key,
    icon: item.icon,
    label: t(`layout:menu.${item.key}`, item.label), // 使用 i18n，fallback 到原始 label
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

