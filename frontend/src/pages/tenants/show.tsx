import { Show } from "@refinedev/antd";
import { Descriptions, Typography, Tag } from "antd";
import { useCan } from "@refinedev/core";
import { useNavigate, useParams } from "react-router";
import { useTranslation } from "react-i18next";
import React, { useEffect } from "react";
import { PageSkeleton, SectionEmpty } from "../../components/ui";
import { useShowPage } from "../../shared/hooks/useShowPage";

const { Text } = Typography;

/**
 * Tenants Show 页面 (FE-2-89)
 *
 * FE-5-107: 集成统一的 Skeleton 和 Empty 状态
 * 
 * 租客详情展示
 * - 使用 Descriptions 展示所有字段
 * - AccessControl：任何已登录用户都可查看
 */

interface ITenant {
  id: string;
  organizationId: string;
  fullName: string;
  email?: string;
  phone?: string;
  idNumber?: string;
  notes?: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

const TenantsShow: React.FC = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const params = useParams<{ id: string }>();
  
  const { data: canShow } = useCan({
    resource: "tenants",
    action: "show",
    params: { id: params.id },
  });

  const { data: canEdit } = useCan({
    resource: "tenants",
    action: "edit",
    params: { id: params.id },
  });

  const { data: canDelete } = useCan({
    resource: "tenants",
    action: "delete",
    params: { id: params.id },
  });

  // 如果无权限，重定向到列表页
  useEffect(() => {
    if (canShow && !canShow.can) {
      navigate("/tenants");
    }
  }, [canShow, navigate]);

  const { data: tenant, isLoading, notFound } = useShowPage<ITenant>({
    resource: "tenants",
    id: params.id,
  });

  // 格式化日期时间
  const formatDateTime = (dateString?: string) => {
    if (!dateString) return "-";
    return new Date(dateString).toLocaleString("zh-CN", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
    });
  };

  // 加载中状态
  if (isLoading) {
    return (
      <Show title={t("tenants:page.showTitle", "租客详情")}>
        <PageSkeleton />
      </Show>
    );
  }

  // 数据不存在
  if (notFound) {
    return (
      <Show title={t("tenants:page.showTitle", "租客详情")}>
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
      title={t("tenants:page.showTitle", "租客详情")}
    >
      <Descriptions
        title={t("tenants:page.showTitle", "租客详情")}
        bordered
        column={1}
      >
        <Descriptions.Item label="ID">
          <Text code>{tenant?.id || "-"}</Text>
        </Descriptions.Item>

        <Descriptions.Item label={t("tenants:columns.name", "姓名")}>
          <Text strong>{tenant?.fullName || "-"}</Text>
        </Descriptions.Item>

        <Descriptions.Item label={t("tenants:columns.email", "邮箱")}>
          {tenant?.email || "-"}

        </Descriptions.Item>

        <Descriptions.Item label="电话">
          {tenant?.phone || "-"}
        </Descriptions.Item>

        <Descriptions.Item label="身份证号">
          {tenant?.idNumber || "-"}
        </Descriptions.Item>

        <Descriptions.Item label="激活状态">
          <Tag color={tenant?.isActive ? "green" : "red"}>
            {tenant?.isActive ? "激活" : "停用"}
          </Tag>
        </Descriptions.Item>

        <Descriptions.Item label="备注">
          {tenant?.notes || "-"}
        </Descriptions.Item>

        <Descriptions.Item label="创建时间">
          {formatDateTime(tenant?.createdAt)}
        </Descriptions.Item>

        <Descriptions.Item label="更新时间">
          {formatDateTime(tenant?.updatedAt)}
        </Descriptions.Item>
      </Descriptions>
    </Show>
  );
};

export default TenantsShow;
