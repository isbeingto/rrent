import { HttpException, HttpStatus } from "@nestjs/common";
import { AppErrorCode } from "./app-error-code.enum";

/**
 * 应用统一异常基类
 * 扩展 HttpException 以支持错误码字段
 */
export class AppException extends HttpException {
  public readonly code: AppErrorCode;

  constructor(
    code: AppErrorCode,
    message: string,
    status: HttpStatus = HttpStatus.INTERNAL_SERVER_ERROR,
  ) {
    super(message, status);
    this.code = code;
  }

  /**
   * 重写 getResponse 以包含 code 字段
   */
  getResponse(): object | string {
    const baseResponse = super.getResponse();
    if (typeof baseResponse === "string") {
      return {
        statusCode: this.getStatus(),
        error: this.constructor.name,
        message: baseResponse,
        code: this.code,
      };
    }
    return {
      ...(baseResponse as object),
      code: this.code,
    };
  }
}
