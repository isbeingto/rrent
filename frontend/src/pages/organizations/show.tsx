import { Show } from "@refinedev/antd";
import { Descriptions, Typography } from "antd";
import { useOne, useCan } from "@refinedev/core";
import { useNavigate, useParams } from "react-router";
import React, { useEffect } from "react";

const { Text } = Typography;

/**
 * Organizations Show 页面
 *
 * FE-2-83: 组织详情展示
 * - 使用 Descriptions 展示所有字段
 * - AccessControl：任何已登录用户都可查看（根据 accessControlProvider 规则）
 */

interface IOrganization {
  id: string;
  name: string;
  code: string;
  description?: string;
  timezone?: string;
  createdAt: string;
  updatedAt: string;
}

const OrganizationsShow: React.FC = () => {
  const navigate = useNavigate();
  const params = useParams<{ id: string }>();
  
  const { data: canShow } = useCan({
    resource: "organizations",
    action: "show",
    params: { id: params.id },
  });

  const { data: canEdit } = useCan({
    resource: "organizations",
    action: "edit",
    params: { id: params.id },
  });

  const { data: canDelete } = useCan({
    resource: "organizations",
    action: "delete",
    params: { id: params.id },
  });

  // 如果无权限，重定向到列表页
  useEffect(() => {
    if (canShow && !canShow.can) {
      navigate("/organizations");
    }
  }, [canShow, navigate]);

  const { query } = useOne<IOrganization>({
    resource: "organizations",
    id: params.id || "",
  });

  const organization = query.data?.data;
  const isLoading = query.isLoading;

  return (
    <Show 
      isLoading={isLoading}
      canEdit={canEdit?.can}
      canDelete={canDelete?.can}
    >
      <Descriptions
        title="组织详情"
        bordered
        column={1}
      >
        <Descriptions.Item label="ID">
          <Text code>{organization?.id}</Text>
        </Descriptions.Item>
        <Descriptions.Item label="组织名称">
          {organization?.name}
        </Descriptions.Item>
        <Descriptions.Item label="组织编码">
          <Text code>{organization?.code}</Text>
        </Descriptions.Item>
        <Descriptions.Item label="描述">
          {organization?.description || "-"}
        </Descriptions.Item>
        <Descriptions.Item label="时区">
          {organization?.timezone || "-"}
        </Descriptions.Item>
        <Descriptions.Item label="创建时间">
          {organization?.createdAt
            ? new Date(organization.createdAt).toLocaleString("zh-CN")
            : "-"}
        </Descriptions.Item>
        <Descriptions.Item label="更新时间">
          {organization?.updatedAt
            ? new Date(organization.updatedAt).toLocaleString("zh-CN")
            : "-"}
        </Descriptions.Item>
      </Descriptions>
    </Show>
  );
};

export default OrganizationsShow;
