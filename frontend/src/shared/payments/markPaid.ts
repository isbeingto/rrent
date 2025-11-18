/**
 * Mark Payment as Paid - Shared Helper (FE-3-97)
 * 
 * 共享的"标记已支付"业务逻辑，供以下页面使用：
 * - src/pages/payments/show.tsx (详情页)
 * - src/pages/payments/index.tsx (列表页内联操作)
 * 
 * API 契约（BE-6-53）：
 * - Endpoint: POST /payments/:id/mark-paid
 * - Headers: Authorization, X-Organization-Id (由 http 客户端自动注入)
 * - Body: {} (空对象)
 * - Response: 201 Created, 返回更新后的 Payment
 * 
 * 权限：OWNER/ADMIN/PROPERTY_MGR/OPERATOR
 * 状态限制：仅 PENDING/OVERDUE 可标记
 */

import http from "@shared/api/http";
import type { MessageInstance } from "antd/es/message/interface";
import type { ModalStaticFunctions } from "antd/es/modal/confirm";

export enum PaymentStatus {
  PENDING = "PENDING",
  PAID = "PAID",
  PARTIAL_PAID = "PARTIAL_PAID",
  OVERDUE = "OVERDUE",
  CANCELED = "CANCELED",
}

export interface IPayment {
  id: string;
  status: PaymentStatus | string;
  amount: string | number;
  currency: string;
  [key: string]: unknown;
}

export interface MarkPaidOptions {
  payment: IPayment;
  onSuccess?: () => void;
  onError?: (errorMessage: string) => void;
  message: MessageInstance;
  modal: Omit<ModalStaticFunctions, 'warn'>;
}

/**
 * 判断是否可以标记已支付
 * @param payment 支付单对象
 * @param canEdit 用户是否有编辑权限
 */
export function canMarkPaymentAsPaid(
  payment: IPayment | null | undefined,
  canEdit: boolean
): boolean {
  if (!payment || !canEdit) return false;
  return (
    payment.status === PaymentStatus.PENDING ||
    payment.status === PaymentStatus.OVERDUE
  );
}

/**
 * 获取标记已支付按钮的 Tooltip 提示文本
 * @param payment 支付单对象
 * @param canEdit 用户是否有编辑权限
 */
export function getMarkPaidTooltip(
  payment: IPayment | null | undefined,
  canEdit: boolean
): string {
  if (!payment) return "";
  if (!canEdit) return "您没有权限执行此操作";
  if (payment.status === PaymentStatus.PAID) return "此支付单已经是已支付状态";
  if (payment.status === PaymentStatus.CANCELED) return "已取消的支付单无法标记为已支付";
  if (payment.status === PaymentStatus.PARTIAL_PAID) return "部分支付状态需要进一步处理";
  return "";
}

/**
 * 执行标记已支付操作
 * @param options 选项参数
 * @returns Promise，用于外部控制 loading 状态
 */
export async function markPaymentAsPaid(
  options: MarkPaidOptions
): Promise<void> {
  const { payment, onSuccess, onError, message: msg, modal } = options;

  return new Promise<void>((resolve, reject) => {
    modal.confirm({
      title: "确认标记已支付",
      content: `确定要将此支付单标记为已支付吗？金额：${payment.currency} ${Number(payment.amount).toFixed(2)}`,
      okText: "确认",
      cancelText: "取消",
      onOk: async () => {
        try {
          await http.post(`/payments/${payment.id}/mark-paid`, {});
          msg.success("支付已标记为已支付");
          onSuccess?.();
          resolve();
        } catch (error: unknown) {
          const err = error as {
            response?: { data?: { message?: string } };
            message?: string;
          };
          const errorMessage =
            err?.response?.data?.message ||
            err?.message ||
            "标记失败";
          msg.error(errorMessage);
          onError?.(errorMessage);
          reject(new Error(errorMessage));
        }
      },
      onCancel: () => {
        reject(new Error("User cancelled"));
      },
    });
  });
}
