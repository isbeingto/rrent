import { HttpStatus } from "@nestjs/common";
import { AppException } from "./app-exception.base";
import { AppErrorCode } from "./app-error-code.enum";

/**
 * 租约已激活异常
 */
export class LeaseAlreadyActiveException extends AppException {
  constructor(leaseId: string) {
    super(
      AppErrorCode.LEASE_ALREADY_ACTIVE,
      `Lease "${leaseId}" is already active`,
      HttpStatus.CONFLICT,
    );
  }
}

/**
 * 租约状态不合法异常
 * 用于租约处于不能被激活的状态（如 TERMINATED, EXPIRED）
 */
export class LeaseInvalidStatusException extends AppException {
  constructor(leaseId: string, currentStatus: string) {
    super(
      AppErrorCode.LEASE_STATUS_INVALID_FOR_ACTIVATION,
      `Lease "${leaseId}" with status "${currentStatus}" cannot be activated`,
      HttpStatus.CONFLICT,
    );
  }
}

/**
 * 房源不空闲异常
 * 用于房源状态不是 VACANT 或 RESERVED
 */
export class UnitNotVacantException extends AppException {
  constructor(unitId: string, currentStatus: string) {
    super(
      AppErrorCode.UNIT_NOT_VACANT,
      `Unit "${unitId}" is not vacant (current status: "${currentStatus}")`,
      HttpStatus.CONFLICT,
    );
  }
}

/**
 * 租约激活冲突异常
 * 用于事务处理中的其他冲突或数据库操作失败
 */
export class LeaseActivationConflictException extends AppException {
  constructor(message: string) {
    super(AppErrorCode.LEASE_ACTIVATION_CONFLICT, message, HttpStatus.CONFLICT);
  }
}
