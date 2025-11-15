import { HttpStatus } from "@nestjs/common";
import { AppException } from "./app-exception.base";
import { AppErrorCode } from "./app-error-code.enum";

/**
 * 支付单状态不合法异常
 * 用于支付单处于不能标记已支付的状态（如已经是 PAID 或 CANCELLED）
 */
export class PaymentInvalidStatusForMarkPaidException extends AppException {
  constructor(paymentId: string, currentStatus: string) {
    super(
      AppErrorCode.PAYMENT_STATUS_INVALID_FOR_MARK_PAID,
      `Payment "${paymentId}" with status "${currentStatus}" cannot be marked as paid`,
      HttpStatus.CONFLICT,
    );
  }
}
