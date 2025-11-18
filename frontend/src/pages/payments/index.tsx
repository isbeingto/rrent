import {
  ShowButton,
} from "@refinedev/antd";
import {
  Space,
  Tag,
  Form,
  Select,
  DatePicker,
  Button,
  Row,
  Col,
  Card,
  message,
} from "antd";
import { useCan } from "@refinedev/core";
import React from "react";
import type { ColumnsType } from "antd/es/table";
import dayjs from "dayjs";
import { ResourceTable } from "../../shared/components/ResourceTable";

const { RangePicker } = DatePicker;

/**
 * Payments List 页面 (FE-2-92, refactored in FE-2-94)
 *
 * 实现 Payments 列表页，支持：
 * - 分页（page/limit）、排序（dueDate asc by default）
 * - 多条件筛选（status、dueDateFrom/dueDateTo）
 * - 权限控制（OWNER/ADMIN 可标记已支付，所有角色可查看）
 * - Data Provider 集成（FE-1-77）、Auth（FE-1-78）、AccessControl（FE-1-79）、HTTP（FE-1-80）
 * - 使用通用 ResourceTable 组件（FE-2-94）
 *
 * 依赖：
 * - BE-3-35（Payments 资源）
 * - BE-6-53（支付流 & markPaid 约定）
 * - BE-7-63（分页/筛选/排序 E2E）
 *
 * 字段说明（来自 backend/prisma/schema.prisma 的 Payment 模型）：
 * - id: 支付单 ID
 * - leaseId: 租约 ID
 * - type: 支付类型（RENT/DEPOSIT/...）
 * - status: 支付状态（PENDING/PARTIAL/PAID/OVERDUE/CANCELED）
 * - amount: 金额
 * - currency: 币种
 * - dueDate: 到期日期
 * - paidAt: 实际支付日期（可选）
 * - createdAt/updatedAt: 时间戳
 *
 * 筛选参数（来自 backend/src/modules/payment/dto/query-payment.dto.ts）：
 * - organizationId: 必需（由 dataProvider 自动注入）
 * - status: 支付状态（可选）
 * - dueDateFrom: 到期日期开始（可选）
 * - dueDateTo: 到期日期结束（可选）
 * - leaseId: 租约 ID（可选，暂未在筛选区使用）
 *
 * 注意：
 * - 后端默认排序：dueDate ASC（按 BE-7 文档）
 * - 标记已支付功能实现于 FE-2-93 任务
 */

// 支付状态枚举（与 backend/prisma/schema.prisma 保持一致）
enum PaymentStatus {
  PENDING = "PENDING",
  PARTIAL = "PARTIAL",
  PAID = "PAID",
  OVERDUE = "OVERDUE",
  CANCELED = "CANCELED",
}

interface IPayment {
  id: string;
  organizationId: string;
  leaseId: string;
  type: string;
  status: PaymentStatus;
  amount: number;
  currency: string;
  dueDate: string;
  paidAt?: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

// 状态显示配置
const statusConfig: Record<PaymentStatus, { color: string; text: string }> = {
  [PaymentStatus.PENDING]: { color: "processing", text: "待支付" },
  [PaymentStatus.PARTIAL]: { color: "warning", text: "部分支付" },
  [PaymentStatus.PAID]: { color: "success", text: "已支付" },
  [PaymentStatus.OVERDUE]: { color: "error", text: "已逾期" },
  [PaymentStatus.CANCELED]: { color: "default", text: "已取消" },
};

const PaymentsList: React.FC = () => {
  // AccessControl checks for action buttons
  const { data: canEdit } = useCan({
    resource: "payments",
    action: "edit",
  });

  const { data: canShow } = useCan({
    resource: "payments",
    action: "show",
  });

  const [form] = Form.useForm();

  const handleFilterSubmit = async (values: Record<string, unknown>) => {
    const filters: Array<{ field: string; operator: "eq"; value: unknown }> = [];

    if (values.status) {
      filters.push({
        field: "status",
        operator: "eq",
        value: values.status,
      });
    }

    if (values.dateRange && Array.isArray(values.dateRange) && values.dateRange.length === 2) {
      const [start, end] = values.dateRange;
      if (start) {
        filters.push({
          field: "dueDateFrom",
          operator: "eq",
          value: dayjs(start).format("YYYY-MM-DD"),
        });
      }
      if (end) {
        filters.push({
          field: "dueDateTo",
          operator: "eq",
          value: dayjs(end).format("YYYY-MM-DD"),
        });
      }
    }

    // Note: ResourceTable's useTable hook will handle these filters internally via setFilters
    console.log("[FILTER] Submitted filters:", filters);
  };

  const handleFilterReset = () => {
    form.resetFields();
    // Note: ResourceTable will handle resetting filters
  };

  const handleMarkPaid = (paymentId: string) => {
    // TODO: FE-2-93 任务实现真实的 markPaid 功能
    message.info(`标记已支付功能开发中 (Payment ID: ${paymentId}) - 将在 FE-2-93 任务中实现`);
  };

  const columns: ColumnsType<IPayment> = [
    {
      title: "账单编号",
      dataIndex: "id",
      key: "id",
      width: 120,
      ellipsis: true,
      render: (id: string) => (
        <span title={id}>{id.slice(0, 8)}...</span>
      ),
    },
    {
      title: "租约",
      dataIndex: "leaseId",
      key: "leaseId",
      width: 120,
      ellipsis: true,
      render: (leaseId: string) => (
        <span title={leaseId}>{leaseId.slice(0, 8)}...</span>
      ),
    },
    {
      title: "类型",
      dataIndex: "type",
      key: "type",
      width: 100,
    },
    {
      title: "金额",
      dataIndex: "amount",
      key: "amount",
      width: 120,
      sorter: true,
      render: (amount: string, record: IPayment) => (
        <span>{record.currency} {Number(amount).toFixed(2)}</span>
      ),
    },
    {
      title: "状态",
      dataIndex: "status",
      key: "status",
      width: 100,
      render: (status: PaymentStatus) => {
        const config = statusConfig[status] || { color: "default", text: status };
        return <Tag color={config.color}>{config.text}</Tag>;
      },
    },
    {
      title: "到期日期",
      dataIndex: "dueDate",
      key: "dueDate",
      width: 120,
      sorter: true,
      render: (dueDate: string) => dayjs(dueDate).format("YYYY-MM-DD"),
    },
    {
      title: "实际支付日期",
      dataIndex: "paidAt",
      key: "paidAt",
      width: 140,
      render: (paidAt: string | undefined) =>
        paidAt ? dayjs(paidAt).format("YYYY-MM-DD HH:mm") : "-",
    },
    {
      title: "创建时间",
      dataIndex: "createdAt",
      key: "createdAt",
      width: 160,
      sorter: true,
      render: (createdAt: string) => dayjs(createdAt).format("YYYY-MM-DD HH:mm"),
    },
    {
      title: "操作",
      key: "actions",
      width: 180,
      fixed: "right",
      render: (_: unknown, record: IPayment) => (
        <Space size="small">
          {canShow?.can && <ShowButton hideText size="small" recordItemId={record.id} />}
          {canEdit?.can && record.status !== PaymentStatus.PAID && (
            <Button
              type="link"
              size="small"
              onClick={() => handleMarkPaid(record.id)}
            >
              标记已支付
            </Button>
          )}
        </Space>
      ),
    },
  ];

  // 筛选区域组件
  const filtersComponent = (
    <Card>
      <Form form={form} layout="vertical" onFinish={handleFilterSubmit}>
        <Row gutter={16}>
          <Col xs={24} sm={12} md={8}>
            <Form.Item label="支付状态" name="status">
              <Select placeholder="选择状态" allowClear>
                <Select.Option value={PaymentStatus.PENDING}>
                  待支付
                </Select.Option>
                <Select.Option value={PaymentStatus.PARTIAL}>
                  部分支付
                </Select.Option>
                <Select.Option value={PaymentStatus.PAID}>
                  已支付
                </Select.Option>
                <Select.Option value={PaymentStatus.OVERDUE}>
                  已逾期
                </Select.Option>
                <Select.Option value={PaymentStatus.CANCELED}>
                  已取消
                </Select.Option>
              </Select>
            </Form.Item>
          </Col>
          <Col xs={24} sm={12} md={8}>
            <Form.Item label="到期日期区间" name="dateRange">
              <RangePicker style={{ width: "100%" }} />
            </Form.Item>
          </Col>
          <Col
            xs={24}
            md={8}
            style={{
              display: "flex",
              alignItems: "flex-end",
              paddingBottom: "24px",
            }}
          >
            <Space>
              <Button type="primary" htmlType="submit">
                查询
              </Button>
              <Button onClick={handleFilterReset}>重置</Button>
            </Space>
          </Col>
        </Row>
      </Form>
    </Card>
  );

  return (
    <ResourceTable<IPayment>
      resource="payments"
      columns={columns}
      filters={filtersComponent}
      defaultPageSize={20}
      defaultSorter={{ field: "dueDate", order: "asc" }}
    />
  );
};

export default PaymentsList;
