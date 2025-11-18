import { Show } from "@refinedev/antd";
import { Descriptions, Typography, Tag, Button, Tooltip, App, Card, Alert, Space } from "antd";
import { useOne, useInvalidate, useCan } from "@refinedev/core";
import { useParams } from "react-router";
import React, { useState } from "react";
import dayjs from "dayjs";
import { DollarOutlined } from "@ant-design/icons";
import {
  PaymentStatus,
  type IPayment,
  markPaymentAsPaid,
  canMarkPaymentAsPaid,
  getMarkPaidTooltip,
} from "@shared/payments/markPaid";
import { computePaymentStatusMeta } from "@shared/payments/status";

const { Text } = Typography;

/**
 * Payments Show 页面
 *
 * FE-2-93: 支付单详情展示 + Mark-Paid 功能
 * FE-3-97: 使用共享的 markPaid helper
 * - 使用 Descriptions 展示所有字段
 * - 实现标记已支付功能（Mark-Paid）
 * - 权限控制：仅 OWNER/ADMIN/PROPERTY_MGR/OPERATOR 可标记
 * - 状态限制：仅 PENDING/OVERDUE 可标记
 */

interface IPaymentDetail extends IPayment {
  organizationId: string;
  leaseId: string;
  type: string;
  dueDate: string;
  paidAt?: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

const PaymentsShow: React.FC = () => {
  const params = useParams<{ id: string }>();
  const invalidate = useInvalidate();
  const [isMarkingPaid, setIsMarkingPaid] = useState(false);
  const { modal, message } = App.useApp();

  const { data: canData } = useCan({
    resource: "payments",
    action: "edit",
  });
  const canEdit = canData?.can ?? false;

  const { query } = useOne<IPaymentDetail>({
    resource: "payments",
    id: params.id || "",
  });

  const payment = query.data?.data;
  const isLoading = query.isLoading;

  const handleMarkPaid = async () => {
    if (!payment) return;

    setIsMarkingPaid(true);
    try {
      await markPaymentAsPaid({
        payment,
        message,
        modal,
        onSuccess: () => {
          query.refetch();
          invalidate({
            resource: "payments",
            invalidates: ["list"],
          });
        },
      });
    } catch {
      // Error already handled by markPaymentAsPaid
    } finally {
      setIsMarkingPaid(false);
    }
  };

  // 判断是否可以标记已支付
  const canMark = canMarkPaymentAsPaid(payment, canEdit);
  const tooltip = getMarkPaidTooltip(payment, canEdit);

  return (
    <Show
      isLoading={isLoading}
      headerButtons={({ defaultButtons }) => (
        <>
          {defaultButtons}
          <Tooltip title={tooltip}>
            <Button
              type="primary"
              icon={<DollarOutlined />}
              onClick={handleMarkPaid}
              loading={isMarkingPaid}
              disabled={!canMark || isMarkingPaid}
            >
              标记已支付
            </Button>
          </Tooltip>
        </>
      )}
    >
      {payment && (
        <>
          {/* 状态辅助信息卡片 (FE-3-99) */}
          <Card style={{ marginBottom: 20 }}>
            <Space direction="vertical" style={{ width: '100%' }} size="small">
              {(() => {
                const meta = computePaymentStatusMeta({
                  status: payment.status as string,
                  dueDate: payment.dueDate as string,
                  paidAt: payment.paidAt as string | undefined,
                });
                
                // 逾期提示
                if (meta.overdueDays !== null && meta.overdueDays > 0) {
                  return (
                    <Alert
                      message={`该支付单已逾期 ${meta.overdueDays} 天`}
                      type="error"
                      showIcon
                    />
                  );
                }
                
                // 即将到期提示
                if (meta.isUpcoming && meta.daysToDue !== null) {
                  return (
                    <Alert
                      message={`距离到期还剩 ${meta.daysToDue} 天`}
                      type="warning"
                      showIcon
                    />
                  );
                }
                
                // 已支付信息
                if (payment.status === PaymentStatus.PAID && payment.paidAt) {
                  return (
                    <Alert
                      message={`已于 ${dayjs(payment.paidAt as string).format('YYYY-MM-DD HH:mm')} 支付`}
                      type="success"
                      showIcon
                    />
                  );
                }
                
                return null;
              })()}
            </Space>
          </Card>

          <Descriptions bordered column={2}>
          <Descriptions.Item label="支付单 ID" span={2}>
            <Text copyable>{payment.id}</Text>
          </Descriptions.Item>
          <Descriptions.Item label="租约 ID">
            <Text copyable>{payment.leaseId as string}</Text>
          </Descriptions.Item>
          <Descriptions.Item label="类型">
            {payment.type as string}
          </Descriptions.Item>
          <Descriptions.Item label="状态">
            {(() => {
              const meta = computePaymentStatusMeta({
                status: payment.status as string,
                dueDate: payment.dueDate as string,
                paidAt: payment.paidAt as string | undefined,
              });
              return (
                <Tag color={meta.badgeColor}>
                  {meta.badgeText}
                  {meta.overdueDays !== null && meta.overdueDays > 0 && (
                    <span> ({meta.overdueDays}天)</span>
                  )}
                </Tag>
              );
            })()}
          </Descriptions.Item>
          <Descriptions.Item label="金额">
            {payment.currency} {Number(payment.amount).toFixed(2)}
          </Descriptions.Item>
          <Descriptions.Item label="到期日期">
            {dayjs(payment.dueDate as string).format("YYYY-MM-DD")}
          </Descriptions.Item>
          <Descriptions.Item label="实际支付日期">
            {payment.paidAt ? dayjs(payment.paidAt as string).format("YYYY-MM-DD HH:mm") : "-"}
          </Descriptions.Item>
          <Descriptions.Item label="备注" span={2}>
            {(payment.notes as string) || "-"}
          </Descriptions.Item>
          <Descriptions.Item label="创建时间">
            {dayjs(payment.createdAt as string).format("YYYY-MM-DD HH:mm:ss")}
          </Descriptions.Item>
          <Descriptions.Item label="更新时间">
            {dayjs(payment.updatedAt as string).format("YYYY-MM-DD HH:mm:ss")}
          </Descriptions.Item>
        </Descriptions>
        </>
      )}
    </Show>
  );
};

export default PaymentsShow;
