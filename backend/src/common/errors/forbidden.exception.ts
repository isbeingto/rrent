import { HttpStatus } from "@nestjs/common";
import { AppException } from "./app-exception.base";
import { AppErrorCode } from "./app-error-code.enum";

/**
 * 权限异常基类
 */
export class ForbiddenOperationException extends AppException {
  constructor(
    message = "Operation is not allowed",
    code: AppErrorCode = AppErrorCode.FORBIDDEN,
  ) {
    super(code, message, HttpStatus.FORBIDDEN);
  }
}

/**
 * 跨组织访问异常
 */
export class CrossOrgAccessException extends AppException {
  constructor(message = "Cannot access resources in another organization") {
    super(AppErrorCode.CROSS_ORG_ACCESS, message, HttpStatus.FORBIDDEN);
  }
}

/**
 * 关系不一致异常（如 Lease 链路中 org/property/unit/tenant 不匹配）
 */
export class InvalidRelationException extends AppException {
  constructor(message = "Resource relationship is invalid") {
    super(AppErrorCode.INVALID_RELATION, message, HttpStatus.BAD_REQUEST);
  }
}
