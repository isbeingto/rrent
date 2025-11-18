/**
 * OrgSwitcher - 组织切换器组件
 * 
 * FE-4-103: 当用户有多个组织时，提供组织切换功能
 * - 单组织用户：不显示任何 UI
 * - 多组织用户：显示下拉选择器，支持切换当前组织
 * - 切换后自动清除缓存并刷新页面
 */

import { Select } from "antd";
import { SwapOutlined } from "@ant-design/icons";
import { useInvalidate } from "@refinedev/core";
import { 
  getUserOrganizations, 
  getCurrentOrganizationId,
  hasMultipleOrganizations 
} from "@shared/auth/organization";
import { switchOrganization } from "@shared/auth/storage";

export default function OrgSwitcher() {
  const invalidate = useInvalidate();
  const organizations = getUserOrganizations();
  const currentOrgId = getCurrentOrganizationId();

  // 如果只有一个或没有组织，不显示切换器
  if (!hasMultipleOrganizations()) {
    return null;
  }

  const handleChange = (value: string) => {
    const targetOrg = organizations.find(org => org.id === value);
    if (!targetOrg) {
      console.error(`[OrgSwitcher] Organization ${value} not found`);
      return;
    }

    console.log(`[OrgSwitcher] Switching to organization: ${targetOrg.name} (${value})`);

    // 切换组织
    switchOrganization(targetOrg.id, targetOrg.code);

    // 清除所有资源缓存
    invalidate({
      resource: "*",
      invalidates: ["all"],
    });

    // 刷新页面以确保所有状态重置
    window.location.reload();
  };

  return (
    <Select
      value={currentOrgId || undefined}
      onChange={handleChange}
      style={{ minWidth: 180 }}
      placeholder="选择组织"
      suffixIcon={<SwapOutlined />}
      options={organizations.map(org => ({
        label: org.name,
        value: org.id,
      }))}
    />
  );
}
