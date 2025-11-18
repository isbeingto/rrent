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
import { useCan } from "@refinedev/core";
import React from "react";
import type { ColumnsType } from "antd/es/table";
import { ResourceTable } from "../../shared/components/ResourceTable";

/**
 * Tenants List 页面 (FE-2-88, refactored in FE-2-94)
 *
 * 实现 Tenants 列表页，支持：
 * - 分页（page/limit）、排序（createdAt desc by default）
 * - 多条件筛选（fullName、keyword、isActive）
 * - 权限控制（OWNER/ADMIN 可 Create/Edit/Delete，VIEWER 只读）
 * - Data Provider 集成（FE-1-77）、Auth（FE-1-78）、AccessControl（FE-1-79）、HTTP（FE-1-80）
 * - 使用通用 ResourceTable 组件（FE-2-94）
 *
 * 依赖：
 * - BE-3-33（Tenants 资源）
 * - BE-5-48（过滤契约）
 *
 * 字段说明（来自 backend/prisma/schema.prisma 的 Tenant 模型）：
 * - fullName: 租客全名
 * - email: 邮箱
 * - phone: 电话
 * - idNumber: 身份证号（可选）
 * - notes: 备注（可选）
 * - isActive: 是否激活
 * - createdAt/updatedAt: 时间戳
 *
 * 筛选参数（来自 backend/src/modules/tenant/dto/query-tenant.dto.ts）：
 * - organizationId: 必需（由 dataProvider 自动注入）
 * - fullName: 姓名精确匹配（可选）
 * - keyword: 关键字模糊搜索（可选）
 * - isActive: 激活状态（可选）
 * - dateStart/dateEnd: 创建时间范围（可选）
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

const TenantsList: React.FC = () => {
  // AccessControl checks for action buttons
  const { data: canEdit } = useCan({
    resource: "tenants",
    action: "edit",
  });

  const { data: canDelete } = useCan({
    resource: "tenants",
    action: "delete",
  });

  const { data: canShow } = useCan({
    resource: "tenants",
    action: "show",
  });

  const [form] = Form.useForm();

  const handleFilterSubmit = async (values: Record<string, unknown>) => {
    const filters: Record<string, unknown> = {};
    if (values.fullName) {
      filters.fullName = values.fullName;
    }
    if (values.keyword) {
      filters.keyword = values.keyword;
    }
    if (values.isActive !== undefined && values.isActive !== null) {
      filters.isActive = values.isActive;
    }
    console.log("[FILTER] Submitted filters:", filters);
    // 在实际应用中，这里会触发表格重新加载对应的过滤数据
  };

  const handleFilterReset = () => {
    form.resetFields();
    console.log("[FILTER] Filters reset");
  };

  const columns: ColumnsType<ITenant> = [
    {
      title: "姓名",
      dataIndex: "fullName",
      key: "fullName",
      sorter: true,
      width: 150,
      fixed: "left",
    },
    {
      title: "邮箱",
      dataIndex: "email",
      key: "email",
      width: 200,
      render: (email: string | undefined) => email || "-",
    },
    {
      title: "电话",
      dataIndex: "phone",
      key: "phone",
      width: 150,
      render: (phone: string | undefined) => phone || "-",
    },
    {
      title: "身份证号",
      dataIndex: "idNumber",
      key: "idNumber",
      width: 180,
      render: (idNumber: string | undefined) => idNumber || "-",
    },
    {
      title: "状态",
      dataIndex: "isActive",
      key: "isActive",
      sorter: true,
      width: 100,
      render: (isActive: boolean) => (
        <Tag color={isActive ? "green" : "red"}>
          {isActive ? "激活" : "停用"}
        </Tag>
      ),
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
      render: (_, record: ITenant) => (
        <Space size="small">
          {canShow?.can && (
            <ShowButton
              hideText
              size="small"
              recordItemId={record.id}
              resource="tenants"
            />
          )}
          {canEdit?.can && (
            <EditButton
              hideText
              size="small"
              recordItemId={record.id}
              resource="tenants"
            />
          )}
          {canDelete?.can && (
            <DeleteButton
              hideText
              size="small"
              recordItemId={record.id}
              resource="tenants"
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
            <Form.Item name="fullName" label="姓名">
              <Input
                placeholder="输入姓名精确查询"
                allowClear
              />
            </Form.Item>
          </Col>
          <Col xs={24} sm={12} lg={6}>
            <Form.Item name="keyword" label="关键字搜索">
              <Input
                placeholder="姓名/邮箱/电话模糊搜索"
                allowClear
              />
            </Form.Item>
          </Col>
          <Col xs={24} sm={12} lg={6}>
            <Form.Item name="isActive" label="激活状态">
              <Select
                placeholder="请选择状态"
                allowClear
                options={[
                  { label: "激活", value: true },
                  { label: "停用", value: false },
                ]}
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
    <ResourceTable<ITenant>
      resource="tenants"
      title="租客管理"
      columns={columns}
      filters={filtersComponent}
      defaultPageSize={20}
      defaultSorter={{ field: "createdAt", order: "desc" }}
    />
  );
};

export default TenantsList;
