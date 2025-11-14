import { Test, TestingModule } from "@nestjs/testing";
import { INestApplication, ValidationPipe } from "@nestjs/common";
import request from "supertest";
import { AppModule } from "../src/app.module";
import { PrismaService } from "../src/prisma/prisma.service";
import { BcryptPasswordHasher } from "../src/common/security/password-hasher";
import { OrgRole } from "@prisma/client";
import helmet from "helmet";
import { HttpExceptionFilter } from "../src/common/filters/http-exception.filter";
import { LoggingInterceptor } from "../src/common/interceptors/logging.interceptor";

/**
 * Auth E2E Smoke 测试
 * 完整链路验证：登录 -> 获取当前用户信息
 */
describe("Auth Smoke E2E", () => {
  let app: INestApplication;
  let prismaService: PrismaService;
  let passwordHasher: BcryptPasswordHasher;

  const testUser = {
    email: "auth-smoke@example.com",
    password: "AuthSmoke123!",
    fullName: "Auth Smoke Test User",
    organizationCode: "demo-org",
  };

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();

    // 应用全局中间件和 pipes（与 main.ts 保持一致）
    app.use(helmet());
    app.useGlobalFilters(new HttpExceptionFilter());
    app.useGlobalInterceptors(new LoggingInterceptor());
    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        forbidNonWhitelisted: true,
        transform: true,
        transformOptions: {
          enableImplicitConversion: true,
        },
      }),
    );

    await app.init();

    // 获取 Prisma 和 PasswordHasher 服务
    prismaService = moduleFixture.get<PrismaService>(PrismaService);
    passwordHasher =
      moduleFixture.get<BcryptPasswordHasher>(BcryptPasswordHasher);
  });

  afterAll(async () => {
    // 清理测试用户
    await prismaService.user.deleteMany({
      where: {
        email: testUser.email,
      },
    });

    await app.close();
  });

  it("should login and get /auth/me successfully", async () => {
    // 1. 准备测试用户
    const organization = await prismaService.organization.findFirst({
      where: {
        code: testUser.organizationCode,
      },
    });

    if (!organization) {
      throw new Error(
        `Organization with code "${testUser.organizationCode}" not found. Please run seed first.`,
      );
    }

    // 检查用户是否已存在，如果存在则删除
    await prismaService.user.deleteMany({
      where: {
        email: testUser.email,
      },
    });

    // 创建测试用户
    const hashedPassword = await passwordHasher.hash(testUser.password);
    const user = await prismaService.user.create({
      data: {
        email: testUser.email,
        passwordHash: hashedPassword,
        fullName: testUser.fullName,
        organizationId: organization.id,
        role: OrgRole.OWNER,
        isActive: true,
      },
    });

    expect(user).toBeDefined();
    expect(user.email).toBe(testUser.email);

    // 2. 调用登录接口
    const loginResponse = await request(app.getHttpServer())
      .post("/auth/login")
      .send({
        email: testUser.email,
        password: testUser.password,
        organizationCode: testUser.organizationCode,
      })
      .expect(200);

    expect(loginResponse.body).toBeDefined();
    expect(loginResponse.body.accessToken).toBeDefined();
    expect(typeof loginResponse.body.accessToken).toBe("string");
    expect(loginResponse.body.accessToken.length).toBeGreaterThan(0);

    const { accessToken } = loginResponse.body;

    // 验证返回的用户信息
    expect(loginResponse.body.user).toBeDefined();
    expect(loginResponse.body.user.email).toBe(testUser.email);
    expect(loginResponse.body.user.fullName).toBe(testUser.fullName);
    expect(loginResponse.body.user.organizationId).toBe(organization.id);
    expect(loginResponse.body.user.role).toBe(OrgRole.OWNER);

    // 3. 使用 token 调用 /auth/me
    const meResponse = await request(app.getHttpServer())
      .get("/auth/me")
      .set("Authorization", `Bearer ${accessToken}`)
      .expect(200);

    expect(meResponse.body).toBeDefined();
    expect(meResponse.body.id).toBe(user.id);
    expect(meResponse.body.email).toBe(testUser.email);
    expect(meResponse.body.fullName).toBe(testUser.fullName);
    expect(meResponse.body.organizationId).toBe(organization.id);
    expect(meResponse.body.role).toBe(OrgRole.OWNER);
    expect(meResponse.body.isActive).toBe(true);

    // 验证没有 passwordHash 字段
    expect(meResponse.body.passwordHash).toBeUndefined();
  });

  it("should reject request to /auth/me without token", async () => {
    await request(app.getHttpServer()).get("/auth/me").expect(401);
  });

  it("should reject request to /auth/me with invalid token", async () => {
    await request(app.getHttpServer())
      .get("/auth/me")
      .set("Authorization", "Bearer invalid_token_here")
      .expect(401);
  });
});
