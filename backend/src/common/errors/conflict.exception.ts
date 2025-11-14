import { HttpStatus } from "@nestjs/common";
import { AppException } from "./app-exception.base";
import { AppErrorCode } from "./app-error-code.enum";

/**
 * 唯一约束冲突异常基类
 */
export class ConflictExceptionWithCode extends AppException {
  constructor(code: AppErrorCode, message: string) {
    super(code, message, HttpStatus.CONFLICT);
  }
}

/**
 * 组织代码冲突
 */
export class OrganizationCodeConflictException extends ConflictExceptionWithCode {
  constructor(code: string) {
    super(
      AppErrorCode.ORG_CODE_CONFLICT,
      `Organization with code "${code}" already exists`,
    );
  }
}

/**
 * 物业项目代码冲突
 */
export class PropertyCodeConflictException extends ConflictExceptionWithCode {
  constructor(code: string) {
    super(
      AppErrorCode.PROPERTY_CODE_CONFLICT,
      `Property with code "${code}" already exists in this organization`,
    );
  }
}

/**
 * 单元号冲突
 */
export class UnitNumberConflictException extends ConflictExceptionWithCode {
  constructor(unitNumber: string) {
    super(
      AppErrorCode.UNIT_NUMBER_CONFLICT,
      `Unit number "${unitNumber}" already exists in this property`,
    );
  }
}

/**
 * 租客邮箱冲突
 */
export class TenantEmailConflictException extends ConflictExceptionWithCode {
  constructor(email: string) {
    super(
      AppErrorCode.TENANT_EMAIL_CONFLICT,
      `Tenant with email "${email}" already exists in this organization`,
    );
  }
}

/**
 * 租客电话冲突
 */
export class TenantPhoneConflictException extends ConflictExceptionWithCode {
  constructor(phone: string) {
    super(
      AppErrorCode.TENANT_PHONE_CONFLICT,
      `Tenant with phone "${phone}" already exists in this organization`,
    );
  }
}

/**
 * 用户邮箱冲突
 */
export class UserEmailConflictException extends ConflictExceptionWithCode {
  constructor(email: string) {
    super(
      AppErrorCode.USER_EMAIL_CONFLICT,
      `User with email "${email}" already exists in this organization`,
    );
  }
}
