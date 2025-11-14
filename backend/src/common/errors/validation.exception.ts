import { HttpStatus } from "@nestjs/common";
import { AppException } from "./app-exception.base";
import { AppErrorCode } from "./app-error-code.enum";

/**
 * 业务验证异常
 * 用于业务规则校验失败（区别于 DTO 校验）
 */
export class BusinessValidationException extends AppException {
  constructor(
    message: string,
    code: AppErrorCode = AppErrorCode.VALIDATION_FAILED,
  ) {
    super(code, message, HttpStatus.BAD_REQUEST);
  }
}
