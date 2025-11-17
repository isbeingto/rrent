import { List, useTable } from "@refinedev/antd";
import { Table, Space, Button } from "antd";
import { EditOutlined, DeleteOutlined } from "@ant-design/icons";
import React from "react";
import type { ColumnsType } from "antd/es/table";

/**
 * Properties List 页面
 *
 * FE-1-81: 接入真实 dataProvider，实现列表、分页、排序
 */

interface IProperty {
  id: string;
  name: string;
  code: string;
  addressLine1?: string;
  city?: string;
  state?: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

const PropertiesList: React.FC = () => {
  const { tableProps } = useTable<IProperty>({
    resource: "properties",
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

  const columns: ColumnsType<IProperty> = [
    {
      title: "名称",
      dataIndex: "name",
      key: "name",
      sorter: true,
    },
    {
      title: "编码",
      dataIndex: "code",
      key: "code",
      sorter: true,
    },
    {
      title: "地址",
      key: "address",
      render: (_, record) => {
        const parts = [record.addressLine1, record.city, record.state].filter(
          Boolean
        );
        return parts.length > 0 ? parts.join(", ") : "-";
      },
    },
    {
      title: "状态",
      dataIndex: "isActive",
      key: "isActive",
      render: (isActive: boolean) => (isActive ? "启用" : "禁用"),
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
      render: (_, record) => (
        <Space size="small">
          <Button
            type="link"
            size="small"
            icon={<EditOutlined />}
            onClick={() => console.log("Edit", record.id)}
          >
            编辑
          </Button>
          <Button
            type="link"
            size="small"
            danger
            icon={<DeleteOutlined />}
            onClick={() => console.log("Delete", record.id)}
          >
            删除
          </Button>
        </Space>
      ),
    },
  ];

  return (
    <List>
      <Table
        {...tableProps}
        columns={columns}
        rowKey="id"
        scroll={{ x: 1200 }}
      />
    </List>
  );
};

export default PropertiesList;
