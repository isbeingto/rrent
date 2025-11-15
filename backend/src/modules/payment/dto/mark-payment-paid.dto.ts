import { IsISO8601, IsOptional } from "class-validator";

/**
 * 标记支付单为已支付 DTO
 */
export class MarkPaymentPaidDto {
  @IsOptional()
  @IsISO8601()
  paidAt?: string;
}
