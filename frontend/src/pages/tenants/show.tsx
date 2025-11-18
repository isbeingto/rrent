import { Show } from "@refinedev/antd";
import { Descriptions, Typography, Tag } from "antd";
import { useOne, useCan } from "@refinedev/core";
import { useNavigate, useParams } from "react-router";
import React, { useEffect } from "react";

const { Text } = Typography;

/**
 * Tenants Show 页面 (FE-2-89)
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

  const { query } = useOne<ITenant>({
    resource: "tenants",
    id: params.id || "",
  });

  const tenant = query.data?.data;
  const isLoading = query.isLoading;

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

  return (
    <Show 
      isLoading={isLoading}
      canEdit={canEdit?.can}
      canDelete={canDelete?.can}
    >
      <Descriptions
        title="租客详情"
        bordered
        column={1}
      >
        <Descriptions.Item label="ID">
          <Text code>{tenant?.id || "-"}</Text>
        </Descriptions.Item>

        <Descriptions.Item label="姓名">
          <Text strong>{tenant?.fullName || "-"}</Text>
        </Descriptions.Item>

        <Descriptions.Item label="邮箱">
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
