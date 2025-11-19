import { Show } from "@refinedev/antd";
import { Descriptions, Typography, Tag } from "antd";
import { useCan } from "@refinedev/core";
import { useNavigate, useParams } from "react-router";
import React, { useEffect } from "react";
import { AuditPanel } from "../../components/Audit/AuditPanel";
import { PageSkeleton, SectionEmpty } from "../../components/ui";
import { useShowPage } from "../../shared/hooks/useShowPage";

const { Text } = Typography;

/**
 * Properties Show 页面
 *
 * FE-2-85: 物业详情展示
 * FE-5-106: 审计记录展示
 * FE-5-107: 集成统一的 Skeleton 和 Empty 状态
 * - 使用 Descriptions 展示所有字段
 * - 展示审计日志历史
 * - AccessControl：任何已登录用户都可查看（根据 accessControlProvider 规则）
 */

interface IProperty {
  id: string;
  name: string;
  code: string;
  description?: string;
  addressLine1?: string;
  addressLine2?: string;
  city?: string;
  state?: string;
  postalCode?: string;
  country?: string;
  timezone?: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

const PropertiesShow: React.FC = () => {
  const navigate = useNavigate();
  const params = useParams<{ id: string }>();
  
  const { data: canShow } = useCan({
    resource: "properties",
    action: "show",
    params: { id: params.id },
  });

  const { data: canEdit } = useCan({
    resource: "properties",
    action: "edit",
    params: { id: params.id },
  });

  const { data: canDelete } = useCan({
    resource: "properties",
    action: "delete",
    params: { id: params.id },
  });

  // 如果无权限，重定向到列表页
  useEffect(() => {
    if (canShow && !canShow.can) {
      navigate("/properties");
    }
  }, [canShow, navigate]);

  const { data: property, isLoading, notFound } = useShowPage<IProperty>({
    resource: "properties",
    id: params.id,
  });

  // 格式化地址显示
  const formatAddress = () => {
    if (!property) return "-";
    const parts = [
      property.addressLine1,
      property.addressLine2,
      property.city,
      property.state,
      property.postalCode,
      property.country,
    ].filter(Boolean);
    return parts.length > 0 ? parts.join(", ") : "-";
  };

  // 加载中状态
  if (isLoading) {
    return (
      <Show>
        <PageSkeleton />
      </Show>
    );
  }

  // 数据不存在
  if (notFound) {
    return (
      <Show>
        <SectionEmpty
          type="notFound"
          showReload
          onReload={() => window.location.reload()}
        />
      </Show>
    );
  }

  return (
    <Show 
      isLoading={false}
      canEdit={canEdit?.can}
      canDelete={canDelete?.can}
    >
      <Descriptions
        title="物业详情"
        bordered
        column={1}
      >
        <Descriptions.Item label="ID">
          <Text code>{property?.id}</Text>
        </Descriptions.Item>
        <Descriptions.Item label="物业名称">
          {property?.name}
        </Descriptions.Item>
        <Descriptions.Item label="物业编码">
          <Text code>{property?.code}</Text>
        </Descriptions.Item>
        <Descriptions.Item label="描述">
          {property?.description || "-"}
        </Descriptions.Item>
        <Descriptions.Item label="完整地址">
          {formatAddress()}
        </Descriptions.Item>
        <Descriptions.Item label="地址第一行">
          {property?.addressLine1 || "-"}
        </Descriptions.Item>
        <Descriptions.Item label="地址第二行">
          {property?.addressLine2 || "-"}
        </Descriptions.Item>
        <Descriptions.Item label="城市">
          {property?.city || "-"}
        </Descriptions.Item>
        <Descriptions.Item label="省份/州">
          {property?.state || "-"}
        </Descriptions.Item>
        <Descriptions.Item label="邮政编码">
          {property?.postalCode || "-"}
        </Descriptions.Item>
        <Descriptions.Item label="国家">
          {property?.country || "-"}
        </Descriptions.Item>
        <Descriptions.Item label="时区">
          {property?.timezone || "-"}
        </Descriptions.Item>
        <Descriptions.Item label="状态">
          {property && (
            <Tag color={property.isActive ? "success" : "default"}>
              {property.isActive ? "启用" : "禁用"}
            </Tag>
          )}
        </Descriptions.Item>
        <Descriptions.Item label="创建时间">
          {property?.createdAt
            ? new Date(property.createdAt).toLocaleString("zh-CN")
            : "-"}
        </Descriptions.Item>
        <Descriptions.Item label="更新时间">
          {property?.updatedAt
            ? new Date(property.updatedAt).toLocaleString("zh-CN")
            : "-"}
        </Descriptions.Item>
      </Descriptions>

      {/* 审计记录 */}
      {property && <AuditPanel entity="PROPERTY" entityId={property.id} />}
    </Show>
  );
};

export default PropertiesShow;
