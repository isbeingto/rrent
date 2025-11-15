import { HttpStatus } from "@nestjs/common";
import { AppErrorCode } from "../src/common/errors/app-error-code.enum";
import {
  OrganizationCodeConflictException,
  PropertyCodeConflictException,
  UnitNumberConflictException,
  TenantEmailConflictException,
  TenantPhoneConflictException,
  UserEmailConflictException,
} from "../src/common/errors/conflict.exception";
import {
  CrossOrgAccessException,
  InvalidRelationException,
} from "../src/common/errors/forbidden.exception";
import {
  OrganizationNotFoundException,
  PropertyNotFoundException,
  UnitNotFoundException,
  TenantNotFoundException,
  LeaseNotFoundException,
  PaymentNotFoundException,
  UserNotFoundException,
} from "../src/common/errors/not-found.exception";
import {
  LeaseAlreadyActiveException,
  LeaseInvalidStatusException,
  UnitNotVacantException,
} from "../src/common/errors/lease-activation.exception";
import { PaymentInvalidStatusForMarkPaidException } from "../src/common/errors/payment.exception";
import { BusinessValidationException } from "../src/common/errors/validation.exception";

describe("Custom Exception Classes", () => {
  describe("ConflictException", () => {
    it("should create OrganizationCodeConflictException", () => {
      const exception = new OrganizationCodeConflictException("ORG001");
      expect(exception.getStatus()).toBe(HttpStatus.CONFLICT);
      expect(exception.code).toBe(AppErrorCode.ORG_CODE_CONFLICT);
      expect(exception.message).toContain("ORG001");
    });

    it("should create PropertyCodeConflictException", () => {
      const exception = new PropertyCodeConflictException("PROP001");
      expect(exception.code).toBe(AppErrorCode.PROPERTY_CODE_CONFLICT);
      expect(exception.message).toContain("PROP001");
    });

    it("should create UnitNumberConflictException", () => {
      const exception = new UnitNumberConflictException("101");
      expect(exception.code).toBe(AppErrorCode.UNIT_NUMBER_CONFLICT);
      expect(exception.message).toContain("101");
    });

    it("should create TenantEmailConflictException", () => {
      const exception = new TenantEmailConflictException("test@example.com");
      expect(exception.code).toBe(AppErrorCode.TENANT_EMAIL_CONFLICT);
      expect(exception.message).toContain("test@example.com");
    });

    it("should create TenantPhoneConflictException", () => {
      const exception = new TenantPhoneConflictException("+1234567890");
      expect(exception.code).toBe(AppErrorCode.TENANT_PHONE_CONFLICT);
      expect(exception.message).toContain("+1234567890");
    });

    it("should create UserEmailConflictException", () => {
      const exception = new UserEmailConflictException("user@example.com");
      expect(exception.code).toBe(AppErrorCode.USER_EMAIL_CONFLICT);
      expect(exception.message).toContain("user@example.com");
    });
  });

  describe("ForbiddenException", () => {
    it("should create CrossOrgAccessException", () => {
      const exception = new CrossOrgAccessException();
      expect(exception.getStatus()).toBe(HttpStatus.FORBIDDEN);
      expect(exception.code).toBe(AppErrorCode.CROSS_ORG_ACCESS);
    });

    it("should create InvalidRelationException", () => {
      const exception = new InvalidRelationException();
      expect(exception.code).toBe(AppErrorCode.INVALID_RELATION);
    });
  });

  describe("NotFoundException", () => {
    it("should create OrganizationNotFoundException", () => {
      const exception = new OrganizationNotFoundException("org-123");
      expect(exception.getStatus()).toBe(HttpStatus.NOT_FOUND);
      expect(exception.code).toBe(AppErrorCode.ORG_NOT_FOUND);
      expect(exception.message).toContain("org-123");
    });

    it("should create PropertyNotFoundException", () => {
      const exception = new PropertyNotFoundException("prop-456");
      expect(exception.code).toBe(AppErrorCode.PROPERTY_NOT_FOUND);
      expect(exception.message).toContain("prop-456");
    });

    it("should create UnitNotFoundException", () => {
      const exception = new UnitNotFoundException("unit-789");
      expect(exception.code).toBe(AppErrorCode.UNIT_NOT_FOUND);
      expect(exception.message).toContain("unit-789");
    });

    it("should create TenantNotFoundException", () => {
      const exception = new TenantNotFoundException("tenant-001");
      expect(exception.code).toBe(AppErrorCode.TENANT_NOT_FOUND);
      expect(exception.message).toContain("tenant-001");
    });

    it("should create LeaseNotFoundException with lease ID", () => {
      const exception = new LeaseNotFoundException("lease-002");
      expect(exception.code).toBe(AppErrorCode.LEASE_NOT_FOUND);
      expect(exception.message).toContain("lease-002");
    });

    it("should create PaymentNotFoundException", () => {
      const exception = new PaymentNotFoundException("payment-003");
      expect(exception.code).toBe(AppErrorCode.PAYMENT_NOT_FOUND);
      expect(exception.message).toContain("payment-003");
    });

    it("should create UserNotFoundException", () => {
      const exception = new UserNotFoundException("user-004");
      expect(exception.code).toBe(AppErrorCode.USER_NOT_FOUND);
      expect(exception.message).toContain("user-004");
    });
  });

  describe("LeaseActivationException", () => {
    it("should create LeaseAlreadyActiveException", () => {
      const exception = new LeaseAlreadyActiveException("lease-123");
      expect(exception.getStatus()).toBe(HttpStatus.CONFLICT);
      expect(exception.code).toBe(AppErrorCode.LEASE_ALREADY_ACTIVE);
      expect(exception.message).toContain("lease-123");
    });

    it("should create LeaseInvalidStatusException", () => {
      const exception = new LeaseInvalidStatusException("lease-456", "ENDED");
      expect(exception.code).toBe(
        AppErrorCode.LEASE_STATUS_INVALID_FOR_ACTIVATION,
      );
      expect(exception.message).toContain("lease-456");
      expect(exception.message).toContain("ENDED");
    });

    it("should create UnitNotVacantException", () => {
      const exception = new UnitNotVacantException("unit-789", "OCCUPIED");
      expect(exception.code).toBe(AppErrorCode.UNIT_NOT_VACANT);
      expect(exception.message).toContain("unit-789");
      expect(exception.message).toContain("OCCUPIED");
    });
  });

  describe("PaymentException", () => {
    it("should create PaymentInvalidStatusForMarkPaidException", () => {
      const exception = new PaymentInvalidStatusForMarkPaidException(
        "payment-123",
        "PAID",
      );
      expect(exception.getStatus()).toBe(HttpStatus.CONFLICT);
      expect(exception.code).toBe(
        AppErrorCode.PAYMENT_STATUS_INVALID_FOR_MARK_PAID,
      );
      expect(exception.message).toContain("payment-123");
      expect(exception.message).toContain("PAID");
    });
  });

  describe("ValidationException", () => {
    it("should create BusinessValidationException", () => {
      const exception = new BusinessValidationException("Invalid input data");
      expect(exception.getStatus()).toBe(HttpStatus.BAD_REQUEST);
      expect(exception.code).toBe(AppErrorCode.VALIDATION_FAILED);
      expect(exception.message).toBe("Invalid input data");
    });

    it("should create BusinessValidationException with custom code", () => {
      const exception = new BusinessValidationException(
        "Invalid relation",
        AppErrorCode.INVALID_RELATION,
      );
      expect(exception.getStatus()).toBe(HttpStatus.BAD_REQUEST);
      expect(exception.code).toBe(AppErrorCode.INVALID_RELATION);
      expect(exception.message).toBe("Invalid relation");
    });
  });
});
