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
  Tooltip,
  App,
} from "antd";
import { useCan, useInvalidate } from "@refinedev/core";
import { useTranslation } from "react-i18next";
import React, { useState } from "react";
import type { ColumnsType } from "antd/es/table";
import dayjs from "dayjs";
import { DollarOutlined } from "@ant-design/icons";
import { ResourceTable } from "../../shared/components/ResourceTable";
import {
  PaymentStatus,
  type IPayment as IPaymentBase,
  markPaymentAsPaid,
  canMarkPaymentAsPaid,
  getMarkPaidTooltip,
} from "@shared/payments/markPaid";
import {
  computePaymentStatusMeta,
  formatDueDateWithInfo,
} from "@shared/payments/status";

const { RangePicker } = DatePicker;

/**
 * Payments List 页面 (FE-2-92, refactored in FE-2-94, FE-3-97)
 *
 * 实现 Payments 列表页，支持：
 * - 分页（page/limit）、排序（dueDate asc by default）
 * - 多条件筛选（status、dueDateFrom/dueDateTo）
 * - 权限控制（OWNER/ADMIN/PROPERTY_MGR/OPERATOR 可标记已支付，所有角色可查看）
 * - FE-3-97: 内联"标记已付"功能
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
 * - 标记已支付功能：FE-2-93 详情页 + FE-3-97 列表内联
 */

interface IPayment extends IPaymentBase {
  organizationId: string;
  leaseId: string;
  type: string;
  dueDate: string;
  paidAt?: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

const PaymentsList: React.FC = () => {
  const { t } = useTranslation();
  const invalidate = useInvalidate();
  const { modal, message } = App.useApp();
  const [markingPaymentId, setMarkingPaymentId] = useState<string | null>(null);

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

  const handleMarkPaid = async (payment: IPayment) => {
    const canMark = canMarkPaymentAsPaid(payment, canEdit?.can ?? false);
    if (!canMark) {
      return;
    }

    setMarkingPaymentId(payment.id);
    try {
      await markPaymentAsPaid({
        payment,
        message,
        modal,
        onSuccess: () => {
          invalidate({
            resource: "payments",
            invalidates: ["list"],
          });
        },
      });
    } catch {
      // Error already handled by markPaymentAsPaid
    } finally {
      setMarkingPaymentId(null);
    }
  };

  const columns: ColumnsType<IPayment> = [
    {
      title: "ID",
      dataIndex: "id",
      key: "id",
      width: 100,
      ellipsis: true,
      render: (id: string) => (
        <span title={id}>{id.slice(0, 8)}...</span>
      ),
    },
    {
      title: t("payments:columns.lease", "关联租约"),
      dataIndex: "leaseId",
      key: "leaseId",
      width: 120,
      ellipsis: true,
      render: (leaseId: string) => (
        <span title={leaseId}>{leaseId.slice(0, 8)}...</span>
      ),
    },
    {
      title: t("payments:columns.type", "类型"),
      dataIndex: "type",
      key: "type",
      width: 100,
    },
    {
      title: t("payments:columns.amount", "金额"),
      dataIndex: "amount",
      key: "amount",
      width: 120,
      align: "right",
      sorter: true,
      render: (amount: string, record: IPayment) => (
        <span>{record.currency} {Number(amount).toFixed(2)}</span>
      ),
    },
    {
      title: t("payments:columns.status", "状态"),
      dataIndex: "status",
      key: "status",
      width: 140,
      render: (_: string, record: IPayment) => {
        const meta = computePaymentStatusMeta({
          status: record.status,
          dueDate: record.dueDate,
          paidAt: record.paidAt,
        });
        
        return (
          <Tooltip title={meta.isUpcoming ? t("payments:alerts.toDue", "即将到期") : undefined}>
            <Tag color={meta.badgeColor}>
              {t(`payments:status.${record.status.toLowerCase()}`, meta.badgeText)}
              {meta.overdueDays !== null && meta.overdueDays > 0 && (
                <span> ({t("payments:dueInfo.overdue", { days: meta.overdueDays })})</span>
              )}
            </Tag>
          </Tooltip>
        );
      },
    },
    {
      title: t("payments:columns.dueDate", "到期信息"),
      dataIndex: "dueDate",
      key: "dueDate",
      width: 150,
      align: "center",
      sorter: true,
      render: (_: string, record: IPayment) => {
        // TODO: formatDueDateWithInfo needs to be i18n aware or we format it here
        // For now, we keep it as is but wrap in span
        const formatted = formatDueDateWithInfo({
          status: record.status,
          dueDate: record.dueDate,
          paidAt: record.paidAt,
        });
        return <span style={{ fontSize: '13px' }}>{formatted}</span>;
      },
    },
    {
      title: t("payments:columns.actions", "操作"),
      key: "actions",
      fixed: "right",
      width: 100,
      align: "center",
      render: (_, record: IPayment) => {
        const canMark = canMarkPaymentAsPaid(record, canEdit?.can ?? false);
        const tooltip = getMarkPaidTooltip(record, canEdit?.can ?? false);
        const isMarking = markingPaymentId === record.id;

        return (
          <Space size="small">
            {canShow?.can && <ShowButton hideText size="small" recordItemId={record.id} />}
            {canEdit?.can && (
              <Tooltip title={tooltip}>
                <Button
                  type="link"
                  size="small"
                  icon={<DollarOutlined />}
                  onClick={() => handleMarkPaid(record)}
                  disabled={!canMark || isMarking}
                  loading={isMarking}
                  style={{ display: canMark || record.status === PaymentStatus.PENDING || record.status === PaymentStatus.OVERDUE ? "inline" : "none" }}
                >
                  {t("payments:actions.markPaid", "标记已支付")}
                </Button>
              </Tooltip>
            )}
          </Space>
        );
      },
    },
  ];


  // 筛选区域组件
  const filtersComponent = (
    <Card>
      <Form form={form} layout="vertical" onFinish={handleFilterSubmit}>
        <Row gutter={16}>
          <Col xs={24} sm={12} md={8}>
            <Form.Item label={t("payments:columns.status", "支付状态")} name="status">
              <Select placeholder={t("common:actions.select", "选择状态")} allowClear>
                <Select.Option value={PaymentStatus.PENDING}>
                  {t("payments:status.pending", "待支付")}
                </Select.Option>
                <Select.Option value="PARTIAL">
                  {t("payments:status.partial", "部分支付")}
                </Select.Option>
                <Select.Option value={PaymentStatus.PAID}>
                  {t("payments:status.paid", "已支付")}
                </Select.Option>
                <Select.Option value={PaymentStatus.OVERDUE}>
                  {t("payments:status.overdue", "已逾期")}
                </Select.Option>
                <Select.Option value={PaymentStatus.CANCELED}>
                  {t("payments:status.canceled", "已取消")}
                </Select.Option>
              </Select>
            </Form.Item>
          </Col>
          <Col xs={24} sm={12} md={8}>
            <Form.Item label={t("payments:columns.dueDate", "到期日期")} name="dateRange">
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
                {t("common:actions.search", "查询")}
              </Button>
              <Button onClick={handleFilterReset}>{t("common:actions.reset", "重置")}</Button>
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
