import { List, useTable, DeleteButton, EditButton, ShowButton, CreateButton } from "@refinedev/antd";
import { Table, Space } from "antd";
import { useCan } from "@refinedev/core";
import React from "react";
import type { ColumnsType } from "antd/es/table";

/**
 * Organizations List 页面
 *
 * FE-2-83: 完整 CRUD 实现，对接真实 dataProvider
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
  // AccessControl checks
  const { data: canCreate } = useCan({
    resource: "organizations",
    action: "create",
  });
  
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

  const { tableProps } = useTable<IOrganization>({
    resource: "organizations",
    pagination: {
      pageSize: 20,
    },
    sorters: {
      initial: [
        {
          field: "createdAt",
          order: "desc",
        },
      ],
    },
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
    <List
      headerButtons={({ defaultButtons }) => (
        <>
          {defaultButtons}
          {canCreate?.can && <CreateButton />}
        </>
      )}
    >
      <Table
        {...tableProps}
        columns={columns}
        rowKey="id"
        scroll={{ x: 1200 }}
      />
    </List>
  );
};

export default OrganizationsList;
