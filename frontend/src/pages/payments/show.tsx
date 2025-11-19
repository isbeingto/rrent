import { Show } from "@refinedev/antd";
import { Descriptions, Typography, Tag, Button, Tooltip, App, Card, Alert, Space } from "antd";
import { useInvalidate, useCan } from "@refinedev/core";
import { useParams } from "react-router";
import { useTranslation } from "react-i18next";
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
import { PageSkeleton, SectionEmpty } from "../../components/ui";
import { useShowPage } from "../../shared/hooks/useShowPage";

const { Text } = Typography;

/**
 * Payments Show 页面
 *
 * FE-2-93: 支付单详情展示 + Mark-Paid 功能
 * FE-3-97: 使用共享的 markPaid helper
 * FE-5-107: 集成统一的 Skeleton 和 Empty 状态
 * 
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
  const { t } = useTranslation();
  const params = useParams<{ id: string }>();
  const invalidate = useInvalidate();
  const [isMarkingPaid, setIsMarkingPaid] = useState(false);
  const { modal, message } = App.useApp();

  const { data: canData } = useCan({
    resource: "payments",
    action: "edit",
  });
  const canEdit = canData?.can ?? false;

  const { data: payment, isLoading, notFound, query } = useShowPage<IPaymentDetail>({
    resource: "payments",
    id: params.id,
  });

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

  // 加载中状态
  if (isLoading) {
    return (
      <Show title={t("payments:page.showTitle", "支付详情")}>
        <PageSkeleton />
      </Show>
    );
  }

  // 数据不存在
  if (notFound) {
    return (
      <Show title={t("payments:page.showTitle", "支付详情")}>
        <SectionEmpty
          type="notFound"
          showReload
          onReload={() => window.location.reload()}
        />
      </Show>
    );
  }

  return (
    <Show
      isLoading={false}
      title={t("payments:page.showTitle", "支付详情")}
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
                      message={t("payments:dueInfo.overdue", { days: meta.overdueDays })}
                      type="error"
                      showIcon
                    />
                  );
                }
                
                // 即将到期提示
                if (meta.isUpcoming && meta.daysToDue !== null) {
                  return (
                    <Alert
                      message={t("payments:dueInfo.toDue", { days: meta.daysToDue })}
                      type="warning"
                      showIcon
                    />
                  );
                }
                
                // 已支付信息
                if (payment.status === PaymentStatus.PAID && payment.paidAt) {
                  return (
                    <Alert
                      message={t("payments:dueInfo.paidAt", { date: dayjs(payment.paidAt as string).format('YYYY-MM-DD HH:mm') })}
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
          <Descriptions.Item label={t("payments:columns.id", "支付单 ID")} span={2}>
            <Text copyable>{payment.id}</Text>
          </Descriptions.Item>
          <Descriptions.Item label={t("payments:columns.leaseId", "租约 ID")}>
            <Text copyable>{payment.leaseId as string}</Text>
          </Descriptions.Item>
          <Descriptions.Item label={t("payments:columns.type", "类型")}>
            {payment.type as string}
          </Descriptions.Item>
          <Descriptions.Item label={t("payments:columns.status", "状态")}>
            {(() => {
              const meta = computePaymentStatusMeta({
                status: payment.status as string,
                dueDate: payment.dueDate as string,
                paidAt: payment.paidAt as string | undefined,
              });
              return (
                <Tag color={meta.badgeColor}>
                  {t(`payments:status.${payment.status.toLowerCase()}`, meta.badgeText)}
                  {meta.overdueDays !== null && meta.overdueDays > 0 && (
                    <span> ({t("payments:dueInfo.overdue", { days: meta.overdueDays })})</span>
                  )}
                </Tag>
              );
            })()}
          </Descriptions.Item>
          <Descriptions.Item label={t("payments:columns.amount", "金额")}>
            {payment.currency} {Number(payment.amount).toFixed(2)}
          </Descriptions.Item>
          <Descriptions.Item label={t("payments:columns.dueDate", "到期日期")}>
            {dayjs(payment.dueDate as string).format("YYYY-MM-DD")}
          </Descriptions.Item>
          <Descriptions.Item label={t("payments:columns.paidAt", "实际支付日期")}>
            {payment.paidAt ? dayjs(payment.paidAt as string).format("YYYY-MM-DD HH:mm") : "-"}
          </Descriptions.Item>
          <Descriptions.Item label={t("payments:columns.notes", "备注")} span={2}>
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
