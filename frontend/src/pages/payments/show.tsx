import { Show } from "@refinedev/antd";
import { Descriptions, Typography, Tag, Button, message, Tooltip, App } from "antd";
import { useOne, useInvalidate, useCan } from "@refinedev/core";
import { useParams } from "react-router";
import React, { useState } from "react";
import dayjs from "dayjs";
import { DollarOutlined, ExclamationCircleOutlined } from "@ant-design/icons";
import http from "@shared/api/http";

const { Text } = Typography;

/**
 * Payments Show 页面
 *
 * FE-2-93: 支付单详情展示 + Mark-Paid 功能
 * - 使用 Descriptions 展示所有字段
 * - 实现标记已支付功能（Mark-Paid）
 * - 权限控制：仅 OWNER/ADMIN 可标记
 * - 状态限制：仅 PENDING/OVERDUE 可标记
 */

enum PaymentStatus {
  PENDING = "PENDING",
  PAID = "PAID",
  PARTIAL_PAID = "PARTIAL_PAID",
  OVERDUE = "OVERDUE",
  CANCELED = "CANCELED",
}

interface IPayment {
  id: string;
  organizationId: string;
  leaseId: string;
  type: string;
  status: PaymentStatus;
  amount: string;
  currency: string;
  dueDate: string;
  paidAt?: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

const statusConfig: Record<PaymentStatus, { color: string; text: string }> = {
  [PaymentStatus.PENDING]: { color: "blue", text: "待支付" },
  [PaymentStatus.PAID]: { color: "green", text: "已支付" },
  [PaymentStatus.PARTIAL_PAID]: { color: "orange", text: "部分支付" },
  [PaymentStatus.OVERDUE]: { color: "red", text: "已逾期" },
  [PaymentStatus.CANCELED]: { color: "default", text: "已取消" },
};

const PaymentsShow: React.FC = () => {
  const params = useParams<{ id: string }>();
  const invalidate = useInvalidate();
  const [isMarkingPaid, setIsMarkingPaid] = useState(false);
  const { modal } = App.useApp();

  const { data: canData } = useCan({
    resource: "payments",
    action: "edit",
  });
  const canEdit = canData?.can ?? false;

  const { query } = useOne<IPayment>({
    resource: "payments",
    id: params.id || "",
  });

  const payment = query.data?.data;
  const isLoading = query.isLoading;

  const handleMarkPaid = () => {
    if (!payment) return;

    modal.confirm({
      title: "确认标记已支付",
      icon: <ExclamationCircleOutlined />,
      content: `确定要将此支付单标记为已支付吗？金额：${payment.currency} ${Number(payment.amount).toFixed(2)}`,
      okText: "确认",
      cancelText: "取消",
      onOk: async () => {
        setIsMarkingPaid(true);
        try {
          await http.post(`/payments/${payment.id}/mark-paid`, {});
          message.success("支付已标记为已支付");
          query.refetch();
          invalidate({
            resource: "payments",
            invalidates: ["list"],
          });
        } catch (error: unknown) {
          const err = error as { response?: { data?: { message?: string } }; message?: string };
          const errorMessage = err?.response?.data?.message || err?.message || "标记失败";
          message.error(errorMessage);
        } finally {
          setIsMarkingPaid(false);
        }
      },
    });
  };

  // 判断是否可以标记已支付
  const canMarkPaid = payment && canEdit && 
    (payment.status === PaymentStatus.PENDING || payment.status === PaymentStatus.OVERDUE);

  const getMarkPaidTooltip = () => {
    if (!payment) return "";
    if (!canEdit) return "您没有权限执行此操作";
    if (payment.status === PaymentStatus.PAID) return "此支付单已经是已支付状态";
    if (payment.status === PaymentStatus.CANCELED) return "已取消的支付单无法标记为已支付";
    return "";
  };

  return (
    <Show
      isLoading={isLoading}
      headerButtons={({ defaultButtons }) => (
        <>
          {defaultButtons}
          <Tooltip title={getMarkPaidTooltip()}>
            <Button
              type="primary"
              icon={<DollarOutlined />}
              onClick={handleMarkPaid}
              loading={isMarkingPaid}
              disabled={!canMarkPaid || isMarkingPaid}
            >
              标记已支付
            </Button>
          </Tooltip>
        </>
      )}
    >
      {payment && (
        <Descriptions bordered column={2}>
          <Descriptions.Item label="支付单 ID" span={2}>
            <Text copyable>{payment.id}</Text>
          </Descriptions.Item>
          <Descriptions.Item label="租约 ID">
            <Text copyable>{payment.leaseId}</Text>
          </Descriptions.Item>
          <Descriptions.Item label="类型">
            {payment.type}
          </Descriptions.Item>
          <Descriptions.Item label="状态">
            <Tag color={statusConfig[payment.status as PaymentStatus]?.color || "default"}>
              {statusConfig[payment.status as PaymentStatus]?.text || payment.status}
            </Tag>
          </Descriptions.Item>
          <Descriptions.Item label="金额">
            {payment.currency} {Number(payment.amount).toFixed(2)}
          </Descriptions.Item>
          <Descriptions.Item label="到期日期">
            {dayjs(payment.dueDate).format("YYYY-MM-DD")}
          </Descriptions.Item>
          <Descriptions.Item label="实际支付日期">
            {payment.paidAt ? dayjs(payment.paidAt).format("YYYY-MM-DD HH:mm") : "-"}
          </Descriptions.Item>
          <Descriptions.Item label="备注" span={2}>
            {payment.notes || "-"}
          </Descriptions.Item>
          <Descriptions.Item label="创建时间">
            {dayjs(payment.createdAt).format("YYYY-MM-DD HH:mm:ss")}
          </Descriptions.Item>
          <Descriptions.Item label="更新时间">
            {dayjs(payment.updatedAt).format("YYYY-MM-DD HH:mm:ss")}
          </Descriptions.Item>
        </Descriptions>
      )}
    </Show>
  );
};

export default PaymentsShow;
