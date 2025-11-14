import { HttpStatus } from "@nestjs/common";
import { AppException } from "./app-exception.base";
import { AppErrorCode } from "./app-error-code.enum";

/**
 * 资源未找到异常基类
 */
export class ResourceNotFoundException extends AppException {
  constructor(code: AppErrorCode, message: string) {
    super(code, message, HttpStatus.NOT_FOUND);
  }
}

/**
 * 组织未找到
 */
export class OrganizationNotFoundException extends ResourceNotFoundException {
  constructor(organizationId: string) {
    super(
      AppErrorCode.ORG_NOT_FOUND,
      `Organization with id "${organizationId}" not found`,
    );
  }
}

/**
 * 物业项目未找到
 */
export class PropertyNotFoundException extends ResourceNotFoundException {
  constructor(propertyId: string) {
    super(
      AppErrorCode.PROPERTY_NOT_FOUND,
      `Property with id "${propertyId}" not found`,
    );
  }
}

/**
 * 单元/房间未找到
 */
export class UnitNotFoundException extends ResourceNotFoundException {
  constructor(unitId: string) {
    super(AppErrorCode.UNIT_NOT_FOUND, `Unit with id "${unitId}" not found`);
  }
}

/**
 * 租客未找到
 */
export class TenantNotFoundException extends ResourceNotFoundException {
  constructor(tenantId: string) {
    super(
      AppErrorCode.TENANT_NOT_FOUND,
      `Tenant with id "${tenantId}" not found`,
    );
  }
}

/**
 * 租约未找到
 */
export class LeaseNotFoundException extends ResourceNotFoundException {
  constructor(leaseId: string) {
    super(AppErrorCode.LEASE_NOT_FOUND, `Lease with id "${leaseId}" not found`);
  }
}

/**
 * 支付记录未找到
 */
export class PaymentNotFoundException extends ResourceNotFoundException {
  constructor(paymentId: string) {
    super(
      AppErrorCode.PAYMENT_NOT_FOUND,
      `Payment with id "${paymentId}" not found`,
    );
  }
}

/**
 * 用户未找到
 */
export class UserNotFoundException extends ResourceNotFoundException {
  constructor(userId: string) {
    super(AppErrorCode.USER_NOT_FOUND, `User with id "${userId}" not found`);
  }
}
