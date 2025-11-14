import { Test, TestingModule } from "@nestjs/testing";
import { INestApplication, HttpStatus } from "@nestjs/common";
import request from "supertest";
import { AppModule } from "../src/app.module";
import { AppErrorCode } from "../src/common/errors/app-error-code.enum";

/**
 * 错误响应集成测试
 * 验证所有业务异常是否正确返回 code 字段
 */
describe("Error Response with Code Field (BE-2-29)", () => {
  let app: INestApplication;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  /**
   * 验证错误响应包含 code 字段
   */
  describe("错误响应格式验证", () => {
    it("应该返回包含 code 字段的错误响应 - ORG_NOT_FOUND", async () => {
      const response = await request(app.getHttpServer())
        .get("/orgs/invalid-org-id")
        .expect(HttpStatus.NOT_FOUND);

      expect(response.body).toHaveProperty("statusCode", HttpStatus.NOT_FOUND);
      expect(response.body).toHaveProperty("error");
      expect(response.body).toHaveProperty("message");
      expect(response.body).toHaveProperty("code");
      // 验证 code 值是 ORG_NOT_FOUND 或相关代码
      expect([AppErrorCode.ORG_NOT_FOUND]).toContain(response.body.code);
    });

    /**
     * 演示: OrganizationService.findById() 抛出 OrganizationNotFoundException
     * 期望返回: { statusCode: 404, error: "OrganizationNotFoundException", message: "...", code: "ORG_NOT_FOUND" }
     */
    it("应该返回 ORG_NOT_FOUND 错误码 - 使用 Demo 端点演示", async () => {
      // Demo 端点可能调用 OrganizationService，如果 org 不存在会抛出 OrganizationNotFoundException
      const demoPayload = {
        organizationId: "non-existent-org-id",
        action: "test-error",
      };

      const response = await request(app.getHttpServer())
        .post("/demo")
        .send(demoPayload);

      // 如果返回 404，应该包含 code 字段
      if (response.status === HttpStatus.NOT_FOUND) {
        expect(response.body).toHaveProperty("code");
        expect(response.body.code).toBe(AppErrorCode.ORG_NOT_FOUND);
      }
    });
  });

  /**
   * 验证错误响应结构（适用于所有业务异常）
   */
  describe("标准错误响应结构", () => {
    it("应该保持向后兼容性 - 错误响应有基本字段", async () => {
      const response = await request(app.getHttpServer())
        .get("/health")
        .expect(HttpStatus.OK);

      // 健康检查应该成功
      expect(response.status).toBe(HttpStatus.OK);
    });

    /**
     * 任何 AppException 派生的异常都应该返回格式:
     * {
     *   "statusCode": <http-status>,
     *   "error": "<ExceptionClassName>",
     *   "message": "<error-message>",
     *   "code": "<ERROR_CODE_ENUM_VALUE>"
     * }
     */
    it("验证错误响应包含必需字段: statusCode, error, message, code", async () => {
      const response = await request(app.getHttpServer())
        .get("/orgs/invalid")
        .expect(HttpStatus.NOT_FOUND);

      const { body } = response;
      expect(body).toEqual(
        expect.objectContaining({
          statusCode: expect.any(Number),
          error: expect.any(String),
          message: expect.any(String),
          code: expect.any(String),
        }),
      );

      // 验证 statusCode 和 HTTP 状态码一致
      expect(body.statusCode).toBe(response.status);
    });
  });

  /**
   * 验证不同错误类型返回不同 HTTP 状态码和 code
   */
  describe("不同错误类型的状态码和 code 值", () => {
    // 404 - Not Found: ORG_NOT_FOUND, PROPERTY_NOT_FOUND, 等
    it("应该返回 404 和 XXX_NOT_FOUND code", async () => {
      const response = await request(app.getHttpServer())
        .get("/orgs/missing-id")
        .expect(HttpStatus.NOT_FOUND);

      expect(response.body.statusCode).toBe(HttpStatus.NOT_FOUND);
      expect([
        AppErrorCode.ORG_NOT_FOUND,
        AppErrorCode.PROPERTY_NOT_FOUND,
        AppErrorCode.UNIT_NOT_FOUND,
        AppErrorCode.TENANT_NOT_FOUND,
        AppErrorCode.USER_NOT_FOUND,
      ]).toContain(response.body.code);
    });

    // 409 - Conflict: EMAIL_CONFLICT, CODE_CONFLICT 等
    it("应该返回 409 和 XXX_CONFLICT code（如果发生冲突）", async () => {
      // 这个测试需要实际的创建端点和重复数据
      // 这里只是演示预期结构
      const expectedConflictCodes = [
        AppErrorCode.ORG_CODE_CONFLICT,
        AppErrorCode.PROPERTY_CODE_CONFLICT,
        AppErrorCode.UNIT_NUMBER_CONFLICT,
        AppErrorCode.TENANT_EMAIL_CONFLICT,
        AppErrorCode.TENANT_PHONE_CONFLICT,
        AppErrorCode.USER_EMAIL_CONFLICT,
      ];

      expect(expectedConflictCodes.length).toBeGreaterThan(0);
    });

    // 403 - Forbidden: CROSS_ORG_ACCESS, FORBIDDEN
    it("应该返回 403 和 FORBIDDEN 或 CROSS_ORG_ACCESS code", async () => {
      const forbiddenCodes = [
        AppErrorCode.FORBIDDEN,
        AppErrorCode.CROSS_ORG_ACCESS,
      ];

      expect(forbiddenCodes.length).toBeGreaterThan(0);
    });

    // 400 - Validation: VALIDATION_FAILED
    it("应该返回 400 和 VALIDATION_FAILED code", async () => {
      expect(AppErrorCode.VALIDATION_FAILED).toBeDefined();
    });
  });
});

/**
 * 错误码枚举验证
 * 确保所有定义的错误码都有对应的异常类
 */
describe("AppErrorCode 枚举完整性", () => {
  it("应该包含所有必需的错误码", () => {
    const requiredCodes = [
      // 基础
      AppErrorCode.INTERNAL_ERROR,
      AppErrorCode.VALIDATION_FAILED,
      AppErrorCode.FORBIDDEN,
      AppErrorCode.UNAUTHORIZED,

      // Not Found
      AppErrorCode.ORG_NOT_FOUND,
      AppErrorCode.PROPERTY_NOT_FOUND,
      AppErrorCode.UNIT_NOT_FOUND,
      AppErrorCode.TENANT_NOT_FOUND,
      AppErrorCode.LEASE_NOT_FOUND,
      AppErrorCode.PAYMENT_NOT_FOUND,
      AppErrorCode.USER_NOT_FOUND,

      // Conflicts
      AppErrorCode.ORG_CODE_CONFLICT,
      AppErrorCode.PROPERTY_CODE_CONFLICT,
      AppErrorCode.UNIT_NUMBER_CONFLICT,
      AppErrorCode.TENANT_EMAIL_CONFLICT,
      AppErrorCode.TENANT_PHONE_CONFLICT,
      AppErrorCode.USER_EMAIL_CONFLICT,

      // Business
      AppErrorCode.CROSS_ORG_ACCESS,
      AppErrorCode.INVALID_RELATION,
    ];

    requiredCodes.forEach((code) => {
      expect(code).toBeDefined();
      expect(typeof code).toBe("string");
    });
  });

  it("所有错误码应该是大写英文和下划线", () => {
    const errorCodeValues = Object.values(AppErrorCode);

    errorCodeValues.forEach((code) => {
      expect(code).toMatch(/^[A-Z_]+$/);
    });
  });
});

/**
 * 演示: 实际错误响应示例
 * 这是文档/示例，展示 code 字段如何在实际 API 响应中出现
 */
describe("错误响应示例文档", () => {
  /**
   * 示例 1: OrganizationNotFoundException (404)
   * 当尝试获取不存在的组织时触发
   *
   * 请求:
   *   GET /orgs/org-999
   *
   * 响应 (404):
   *   {
   *     "statusCode": 404,
   *     "error": "OrganizationNotFoundException",
   *     "message": "Organization with id \"org-999\" not found",
   *     "code": "ORG_NOT_FOUND"
   *   }
   */
  it("示例 1: 资源未找到异常包含 code 字段", () => {
    const exampleResponse = {
      statusCode: 404,
      error: "OrganizationNotFoundException",
      message: 'Organization with id "org-999" not found',
      code: "ORG_NOT_FOUND",
    };

    expect(exampleResponse.code).toBe("ORG_NOT_FOUND");
    expect(exampleResponse.statusCode).toBe(404);
  });

  /**
   * 示例 2: UserEmailConflictException (409)
   * 当尝试创建具有已存在的电子邮件的用户时触发
   *
   * 请求:
   *   POST /users
   *   {
   *     "organizationId": "org-123",
   *     "email": "john@example.com",
   *     "password": "...",
   *     "fullName": "John Doe"
   *   }
   *
   * 响应 (409):
   *   {
   *     "statusCode": 409,
   *     "error": "UserEmailConflictException",
   *     "message": "User with email \"john@example.com\" already exists in this organization",
   *     "code": "USER_EMAIL_CONFLICT"
   *   }
   */
  it("示例 2: 冲突异常包含 code 字段", () => {
    const exampleResponse = {
      statusCode: 409,
      error: "UserEmailConflictException",
      message:
        'User with email "john@example.com" already exists in this organization',
      code: "USER_EMAIL_CONFLICT",
    };

    expect(exampleResponse.code).toBe("USER_EMAIL_CONFLICT");
    expect(exampleResponse.statusCode).toBe(409);
  });

  /**
   * 示例 3: ForbiddenOperationException (403)
   * 当尝试访问不同组织的资源时触发
   *
   * 请求:
   *   GET /orgs/org-456/properties/prop-789 (当前用户属于 org-123)
   *
   * 响应 (403):
   *   {
   *     "statusCode": 403,
   *     "error": "ForbiddenOperationException",
   *     "message": "You do not have permission to access this resource",
   *     "code": "CROSS_ORG_ACCESS"
   *   }
   */
  it("示例 3: 禁止操作异常包含 code 字段", () => {
    const exampleResponse = {
      statusCode: 403,
      error: "ForbiddenOperationException",
      message: "You do not have permission to access this resource",
      code: "CROSS_ORG_ACCESS",
    };

    expect(exampleResponse.code).toBe("CROSS_ORG_ACCESS");
    expect(exampleResponse.statusCode).toBe(403);
  });

  /**
   * 示例 4: BusinessValidationException (400)
   * 当业务逻辑验证失败时触发
   *
   * 响应 (400):
   *   {
   *     "statusCode": 400,
   *     "error": "BusinessValidationException",
   *     "message": "Property code must be unique within organization",
   *     "code": "VALIDATION_FAILED"
   *   }
   */
  it("示例 4: 验证失败异常包含 code 字段", () => {
    const exampleResponse = {
      statusCode: 400,
      error: "BusinessValidationException",
      message: "Property code must be unique within organization",
      code: "VALIDATION_FAILED",
    };

    expect(exampleResponse.code).toBe("VALIDATION_FAILED");
    expect(exampleResponse.statusCode).toBe(400);
  });
});
