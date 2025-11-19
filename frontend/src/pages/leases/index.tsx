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
 * Leases List 页面 (FE-2-90, refactored in FE-2-94)
 *
 * 实现 Leases 列表页，支持：
 * - 分页（page/limit）、排序（createdAt desc by default）
 * - 多条件筛选（租客/单元/状态/关键字）
 * - 权限控制（OWNER/ADMIN 可 Create/Edit/Delete，VIEWER 只读）
 * - Data Provider 集成（FE-1-77）、Auth（FE-1-78）、AccessControl（FE-1-79）、HTTP（FE-1-80）
 * - 使用通用 ResourceTable 组件（FE-2-94）
 *
 * 依赖：
 * - BE-3-34（Leases 资源）
 * - BE-6-51（租约状态）
 *
 * 字段说明（来自 backend/prisma/schema.prisma 的 Lease 模型）：
 * - id: 租约 ID
 * - tenantId: 租客 ID
 * - unitId: 单元 ID
 * - propertyId: 物业 ID
 * - status: 租约状态（DRAFT/PENDING/ACTIVE/TERMINATED/EXPIRED）
 * - billCycle: 计费周期（ONE_TIME/MONTHLY/QUARTERLY/YEARLY）
 * - startDate: 开始日期
 * - endDate: 结束日期
 * - rentAmount: 租金金额
 * - currency: 币种（默认 CNY）
 * - depositAmount: 押金金额
 * - notes: 备注
 * - createdAt/updatedAt: 时间戳
 *
 * 筛选参数（来自 backend/src/modules/lease/dto/query-lease.dto.ts）：
 * - organizationId: 必需（由 dataProvider 自动注入）
 * - propertyId: 物业 ID（可选）
 * - unitId: 单元 ID（可选）
 * - tenantId: 租客 ID（可选）
 * - status: 租约状态（可选）
 * - dateStart/dateEnd: 创建时间范围（可选）
 *
 * 注意：
 * - 后端不返回关联对象（tenant/unit），只返回 ID
 * - 筛选条件目前简化为文本输入，未来可扩展为下拉选择
 */

// 租约状态枚举（与 backend/prisma/schema.prisma 保持一致）
enum LeaseStatus {
  DRAFT = "DRAFT",
  PENDING = "PENDING",
  ACTIVE = "ACTIVE",
  TERMINATED = "TERMINATED",
  EXPIRED = "EXPIRED",
}

// 计费周期枚举
enum BillCycle {
  ONE_TIME = "ONE_TIME",
  MONTHLY = "MONTHLY",
  QUARTERLY = "QUARTERLY",
  YEARLY = "YEARLY",
}

interface ILease {
  id: string;
  organizationId: string;
  propertyId: string;
  unitId: string;
  tenantId: string;
  status: LeaseStatus;
  billCycle: BillCycle;
  startDate: string;
  endDate?: string;
  rentAmount: number | string; // Prisma Decimal 可能返回字符串
  currency: string;
  depositAmount?: number | string | null; // Prisma Decimal 可能返回字符串或 null
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

// 状态显示配置
const statusConfig: Record<LeaseStatus, { color: string; text: string }> = {
  [LeaseStatus.DRAFT]: { color: "default", text: "草稿" },
  [LeaseStatus.PENDING]: { color: "processing", text: "待激活" },
  [LeaseStatus.ACTIVE]: { color: "success", text: "生效中" },
  [LeaseStatus.TERMINATED]: { color: "error", text: "已终止" },
  [LeaseStatus.EXPIRED]: { color: "default", text: "已过期" },
};

// 计费周期显示配置
const billCycleConfig: Record<BillCycle, string> = {
  [BillCycle.ONE_TIME]: "一次性",
  [BillCycle.MONTHLY]: "月付",
  [BillCycle.QUARTERLY]: "季付",
  [BillCycle.YEARLY]: "年付",
};

const LeasesList: React.FC = () => {
  // AccessControl checks for action buttons
  const { data: canEdit } = useCan({
    resource: "leases",
    action: "edit",
  });

  const { data: canDelete } = useCan({
    resource: "leases",
    action: "delete",
  });

  const { data: canShow } = useCan({
    resource: "leases",
    action: "show",
  });

  const [form] = Form.useForm();

  const handleFilterSubmit = async (values: Record<string, unknown>) => {
    const filters: Record<string, unknown> = {};
    if (values.tenantId) {
      filters.tenantId = values.tenantId;
    }
    if (values.unitId) {
      filters.unitId = values.unitId;
    }
    if (values.status) {
      filters.status = values.status;
    }
    if (values.keyword) {
      filters.keyword = values.keyword;
    }
    console.log("[FILTER] Submitted filters:", filters);
    // TODO: 实际应用中，这里会触发表格重新加载对应的过滤数据
  };

  const handleFilterReset = () => {
    form.resetFields();
    console.log("[FILTER] Filters reset");
  };

  const columns: ColumnsType<ILease> = [
    {
      title: "租约ID",
      dataIndex: "id",
      key: "id",
      width: 100,
      fixed: "left",
      render: (id: string) => id.substring(0, 8),
    },
    {
      title: "租客ID",
      dataIndex: "tenantId",
      key: "tenantId",
      width: 100,
      render: (id: string) => id.substring(0, 8),
    },
    {
      title: "单元ID",
      dataIndex: "unitId",
      key: "unitId",
      width: 100,
      render: (id: string) => id.substring(0, 8),
    },
    {
      title: "租金",
      dataIndex: "rentAmount",
      key: "rentAmount",
      sorter: true,
      width: 120,
      align: "right",
      render: (amount: number | string, record: ILease) => {
        const numAmount = typeof amount === 'number' ? amount : parseFloat(amount?.toString() || '0');
        return `${record.currency} ${isNaN(numAmount) ? '0.00' : numAmount.toFixed(2)}`;
      },
    },
    {
      title: "计费周期",
      dataIndex: "billCycle",
      key: "billCycle",
      width: 100,
      render: (cycle: BillCycle) => billCycleConfig[cycle] || cycle,
    },
    {
      title: "状态",
      dataIndex: "status",
      key: "status",
      sorter: true,
      width: 100,
      render: (status: LeaseStatus) => {
        const config = statusConfig[status];
        return (
          <Tag color={config.color}>
            {config.text}
          </Tag>
        );
      },
    },
    {
      title: "开始日期",
      dataIndex: "startDate",
      key: "startDate",
      sorter: true,
      width: 120,
      align: "center",
      render: (date: string) => new Date(date).toLocaleDateString("zh-CN"),
    },
    {
      title: "结束日期",
      dataIndex: "endDate",
      key: "endDate",
      width: 120,
      align: "center",
      render: (date: string | undefined) =>
        date ? new Date(date).toLocaleDateString("zh-CN") : "-",
    },
    {
      title: "押金",
      dataIndex: "depositAmount",
      key: "depositAmount",
      width: 120,
      align: "right",
      render: (amount: number | string | null | undefined, record: ILease) => {
        if (amount === null || amount === undefined) return "-";
        const numAmount = typeof amount === 'number' ? amount : parseFloat(amount?.toString() || '0');
        return `${record.currency} ${isNaN(numAmount) ? '0.00' : numAmount.toFixed(2)}`;
      },
    },
    {
      title: "创建时间",
      dataIndex: "createdAt",
      key: "createdAt",
      sorter: true,
      width: 120,
      align: "center",
      render: (date: string) => new Date(date).toLocaleDateString("zh-CN"),
    },
    {
      title: "操作",
      key: "actions",
      fixed: "right",
      width: 100,
      align: "center",
      render: (_, record: ILease) => (
        <Space size="small">
          {canShow?.can && (
            <ShowButton
              hideText
              size="small"
              recordItemId={record.id}
              resource="leases"
            />
          )}
          {canEdit?.can && (
            <EditButton
              hideText
              size="small"
              recordItemId={record.id}
              resource="leases"
            />
          )}
          {canDelete?.can && (
            <DeleteButton
              hideText
              size="small"
              recordItemId={record.id}
              resource="leases"
            />
          )}
        </Space>
      ),
    },
  ];

  // 筛选区域组件
  const filtersComponent = (
    <Card title="筛选条件">
      <Form form={form} layout="vertical" onFinish={handleFilterSubmit}>
        <Row gutter={16}>
          <Col xs={24} sm={12} md={6}>
            <Form.Item label="租客ID" name="tenantId">
              <Input placeholder="输入租客ID（部分匹配）" allowClear />
            </Form.Item>
          </Col>
          <Col xs={24} sm={12} md={6}>
            <Form.Item label="单元ID" name="unitId">
              <Input placeholder="输入单元ID（部分匹配）" allowClear />
            </Form.Item>
          </Col>
          <Col xs={24} sm={12} md={6}>
            <Form.Item label="状态" name="status">
              <Select placeholder="选择状态" allowClear>
                {Object.entries(statusConfig).map(([value, { text }]) => (
                  <Select.Option key={value} value={value}>
                    {text}
                  </Select.Option>
                ))}
              </Select>
            </Form.Item>
          </Col>
          <Col xs={24} sm={12} md={6}>
            <Form.Item label="关键字" name="keyword">
              <Input placeholder="搜索租约（TODO）" allowClear />
            </Form.Item>
          </Col>
        </Row>
        <Row>
          <Col span={24} style={{ textAlign: "right" }}>
            <Space>
              <Button onClick={handleFilterReset}>重置</Button>
              <Button type="primary" htmlType="submit">
                筛选
              </Button>
            </Space>
          </Col>
        </Row>
      </Form>
    </Card>
  );

  return (
    <ResourceTable<ILease>
      resource="leases"
      columns={columns}
      filters={filtersComponent}
      defaultPageSize={20}
      defaultSorter={{ field: "createdAt", order: "desc" }}
    />
  );
};

export default LeasesList;
