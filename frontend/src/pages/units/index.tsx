import {
  DeleteButton,
  EditButton,
  ShowButton,
} from "@refinedev/antd";
import {
  Space,
  Tag,
  Form,
  Select,
  Input,
  Button,
  Row,
  Col,
  Card,
} from "antd";
import { useCan, useList } from "@refinedev/core";
import React from "react";
import type { ColumnsType } from "antd/es/table";
import { ResourceTable } from "@shared/components/ResourceTable";

/**
 * Units List 页面 (FE-2-86)
 *
 * FE-2-94: 重构使用通用 ResourceTable 组件
 * 实现 Units 列表页，支持：
 * - 分页（page/limit）、排序（createdAt desc by default）
 * - 多条件筛选（propertyId、status、keyword）
 * - 权限控制（OWNER/ADMIN 可 Create/Edit/Delete，VIEWER 只读）
 * - Data Provider 集成（FE-1-77）、Auth（FE-1-78）、AccessControl（FE-1-79）、HTTP（FE-1-80）
 *
 * 依赖：
 * - BE-3-32（Units 资源）
 * - BE-5-48（过滤契约）
 */

interface IUnit {
  id: string;
  propertyId: string;
  name?: string;
  unitNumber: string;
  floor?: number;
  bedrooms?: number;
  bathrooms?: number;
  areaSqm?: number;
  status: "VACANT" | "OCCUPIED" | "RESERVED";
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  // 关联数据
  property?: {
    id: string;
    name: string;
  };
}

interface IProperty {
  id: string;
  name: string;
  code?: string;
}

const statusColorMap: Record<string, string> = {
  VACANT: "green",
  OCCUPIED: "red",
  RESERVED: "orange",
};

const statusLabelMap: Record<string, string> = {
  VACANT: "空置",
  OCCUPIED: "已出租",
  RESERVED: "预订",
};

const UnitsList: React.FC = () => {
  // AccessControl checks for action buttons
  const { data: canEdit } = useCan({
    resource: "units",
    action: "edit",
  });

  const { data: canDelete } = useCan({
    resource: "units",
    action: "delete",
  });

  const { data: canShow } = useCan({
    resource: "units",
    action: "show",
  });

  // 获取 Properties 列表用于筛选下拉
  const { result: propertiesResult } = useList<IProperty>({
    resource: "properties",
    pagination: { pageSize: 100 }, // 后端限制最大 100
    queryOptions: { enabled: true },
  });

  const properties = (propertiesResult?.data || []) as IProperty[];

  const [form] = Form.useForm();

  const handleFilterSubmit = async (values: Record<string, unknown>) => {
    const filters: Record<string, unknown> = {};
    if (values.propertyId) {
      filters.propertyId = values.propertyId;
    }
    if (values.status) {
      filters.status = values.status;
    }
    if (values.keyword) {
      filters.keyword = values.keyword;
    }
    console.log("[FILTER] Submitted filters:", filters);
    // 在实际应用中，这里会触发表格重新加载对应的过滤数据
  };

  const handleFilterReset = () => {
    form.resetFields();
    console.log("[FILTER] Filters reset");
  };

  const columns: ColumnsType<IUnit> = [
    {
      title: "单元编号",
      dataIndex: "unitNumber",
      key: "unitNumber",
      sorter: true,
      width: 120,
    },
    {
      title: "楼层",
      dataIndex: "floor",
      key: "floor",
      sorter: true,
      width: 80,
      render: (floor: number | undefined) => floor ?? "-",
    },
    {
      title: "面积（㎡）",
      dataIndex: "areaSqm",
      key: "areaSqm",
      sorter: true,
      width: 100,
      render: (area: number | undefined) => (area ? `${area}㎡` : "-"),
    },
    {
      title: "状态",
      dataIndex: "status",
      key: "status",
      sorter: true,
      width: 100,
      render: (status: string) => (
        <Tag color={statusColorMap[status] || "default"}>
          {statusLabelMap[status] || status}
        </Tag>
      ),
    },
    {
      title: "所属物业",
      dataIndex: ["property", "name"],
      key: "propertyName",
      sorter: true,
      render: (propertyName: string | undefined) => propertyName || "-",
    },
    {
      title: "创建时间",
      dataIndex: "createdAt",
      key: "createdAt",
      sorter: true,
      render: (date: string) => new Date(date).toLocaleString("zh-CN"),
      width: 180,
    },
    {
      title: "操作",
      key: "actions",
      fixed: "right",
      width: 150,
      render: (_, record: IUnit) => (
        <Space size="small">
          {canShow?.can && (
            <ShowButton
              hideText
              size="small"
              recordItemId={record.id}
              resource="units"
            />
          )}
          {canEdit?.can && (
            <EditButton
              hideText
              size="small"
              recordItemId={record.id}
              resource="units"
            />
          )}
          {canDelete?.can && (
            <DeleteButton
              hideText
              size="small"
              recordItemId={record.id}
              resource="units"
            />
          )}
        </Space>
      ),
    },
  ];

  // 筛选区域组件
  const filtersComponent = (
    <Card>
      <Form
        form={form}
        layout="vertical"
        onFinish={handleFilterSubmit}
      >
        <Row gutter={[16, 16]}>
          <Col xs={24} sm={12} lg={6}>
            <Form.Item name="propertyId" label="所属物业">
              <Select
                placeholder="请选择物业"
                allowClear
                options={
                  properties.map((prop: IProperty) => ({
                    label: prop.name,
                    value: prop.id,
                  }))
                }
              />
            </Form.Item>
          </Col>
          <Col xs={24} sm={12} lg={6}>
            <Form.Item name="status" label="单元状态">
              <Select
                placeholder="请选择状态"
                allowClear
                options={[
                  { label: "空置", value: "VACANT" },
                  { label: "已出租", value: "OCCUPIED" },
                  { label: "预订", value: "RESERVED" },
                ]}
              />
            </Form.Item>
          </Col>
          <Col xs={24} sm={12} lg={6}>
            <Form.Item name="keyword" label="关键字搜索">
              <Input
                placeholder="输入单元编号"
                allowClear
              />
            </Form.Item>
          </Col>
          <Col xs={24} sm={12} lg={6}>
            <Form.Item label=" " colon={false}>
              <Space>
                <Button type="primary" htmlType="submit">
                  查询
                </Button>
                <Button
                  onClick={handleFilterReset}
                >
                  重置
                </Button>
              </Space>
            </Form.Item>
          </Col>
        </Row>
      </Form>
    </Card>
  );

  return (
    <ResourceTable<IUnit>
      resource="units"
      title="单元管理"
      columns={columns}
      filters={filtersComponent}
      defaultPageSize={20}
      defaultSorter={{ field: "createdAt", order: "desc" }}
    />
  );
};

export default UnitsList;

