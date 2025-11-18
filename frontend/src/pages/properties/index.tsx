import { DeleteButton, EditButton, ShowButton } from "@refinedev/antd";
import { Space, Tag } from "antd";
import { useCan } from "@refinedev/core";
import React from "react";
import type { ColumnsType } from "antd/es/table";
import { ResourceTable } from "@shared/components/ResourceTable";

/**
 * Properties List 页面
 *
 * FE-2-84: 基于 Organizations CRUD 模式实现完整 Properties 列表
 * FE-2-94: 重构使用通用 ResourceTable 组件
 * - 列表展示：name, code, address, status, createdAt
 * - 分页、排序支持（默认按 createdAt desc）
 * - AccessControl 集成：按钮权限控制
 * - 依赖：FE-1-77 (Data Provider), FE-1-78 (Auth), FE-1-79 (AccessControl), FE-1-80 (Axios Interceptor)
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

const PropertiesList: React.FC = () => {
  // AccessControl checks for action buttons
  const { data: canEdit } = useCan({
    resource: "properties",
    action: "edit",
  });
  
  const { data: canDelete } = useCan({
    resource: "properties",
    action: "delete",
  });
  
  const { data: canShow } = useCan({
    resource: "properties",
    action: "show",
  });

  const columns: ColumnsType<IProperty> = [
    {
      title: "物业名称",
      dataIndex: "name",
      key: "name",
      sorter: true,
    },
    {
      title: "物业编码",
      dataIndex: "code",
      key: "code",
      sorter: true,
    },
    {
      title: "地址",
      key: "address",
      render: (_, record) => {
        const parts = [
          record.addressLine1,
          record.addressLine2,
          record.city,
          record.state,
          record.postalCode,
        ].filter(Boolean);
        return parts.length > 0 ? parts.join(", ") : "-";
      },
    },
    {
      title: "状态",
      dataIndex: "isActive",
      key: "isActive",
      render: (isActive: boolean) => (
        <Tag color={isActive ? "success" : "default"}>
          {isActive ? "启用" : "禁用"}
        </Tag>
      ),
    },
    {
      title: "创建时间",
      dataIndex: "createdAt",
      key: "createdAt",
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
              resource="properties"
            />
          )}
          {canEdit?.can && (
            <EditButton
              hideText
              size="small"
              recordItemId={record.id}
              resource="properties"
            />
          )}
          {canDelete?.can && (
            <DeleteButton
              hideText
              size="small"
              recordItemId={record.id}
              resource="properties"
            />
          )}
        </Space>
      ),
    },
  ];

  return (
    <ResourceTable<IProperty>
      resource="properties"
      columns={columns}
      defaultPageSize={20}
      defaultSorter={{ field: "createdAt", order: "desc" }}
    />
  );
};

export default PropertiesList;
