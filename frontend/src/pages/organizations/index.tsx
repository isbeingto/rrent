import { DeleteButton, EditButton, ShowButton } from "@refinedev/antd";
import { Space } from "antd";
import { useCan } from "@refinedev/core";
import React from "react";
import type { ColumnsType } from "antd/es/table";
import { ResourceTable } from "@shared/components/ResourceTable";

/**
 * Organizations List 页面
 *
 * FE-2-83: 完整 CRUD 实现，对接真实 dataProvider
 * FE-2-94: 重构使用通用 ResourceTable 组件
 * - 列表展示：name, code, description, createdAt, updatedAt
 * - 分页、排序支持
 * - AccessControl 集成：按钮权限控制
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

const OrganizationsList: React.FC = () => {
  // AccessControl checks for action buttons
  const { data: canEdit } = useCan({
    resource: "organizations",
    action: "edit",
  });
  
  const { data: canDelete } = useCan({
    resource: "organizations",
    action: "delete",
  });
  
  const { data: canShow } = useCan({
    resource: "organizations",
    action: "show",
  });

  const columns: ColumnsType<IOrganization> = [
    {
      title: "组织名称",
      dataIndex: "name",
      key: "name",
      sorter: true,
    },
    {
      title: "组织编码",
      dataIndex: "code",
      key: "code",
      sorter: true,
    },
    {
      title: "描述",
      dataIndex: "description",
      key: "description",
      render: (text: string | undefined) => text || "-",
    },
    {
      title: "时区",
      dataIndex: "timezone",
      key: "timezone",
      render: (text: string | undefined) => text || "-",
    },
    {
      title: "创建时间",
      dataIndex: "createdAt",
      key: "createdAt",
      sorter: true,
      render: (date: string) => new Date(date).toLocaleString("zh-CN"),
    },
    {
      title: "更新时间",
      dataIndex: "updatedAt",
      key: "updatedAt",
      sorter: true,
      render: (date: string) => new Date(date).toLocaleString("zh-CN"),
    },
    {
      title: "操作",
      key: "actions",
      fixed: "right",
      render: (_, record) => (
        <Space size="small">
          {canShow?.can && (
            <ShowButton
              hideText
              size="small"
              recordItemId={record.id}
              resource="organizations"
            />
          )}
          {canEdit?.can && (
            <EditButton
              hideText
              size="small"
              recordItemId={record.id}
              resource="organizations"
            />
          )}
          {canDelete?.can && (
            <DeleteButton
              hideText
              size="small"
              recordItemId={record.id}
              resource="organizations"
            />
          )}
        </Space>
      ),
    },
  ];

  return (
    <ResourceTable<IOrganization>
      resource="organizations"
      columns={columns}
      defaultPageSize={20}
      defaultSorter={{ field: "createdAt", order: "desc" }}
    />
  );
};

export default OrganizationsList;
