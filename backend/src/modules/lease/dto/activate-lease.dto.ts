import { IsBoolean, IsOptional } from "class-validator";

/**
 * 租约激活请求 DTO
 */
export class ActivateLeaseDto {
  @IsBoolean()
  @IsOptional()
  generateDepositPayment?: boolean = true;
}
