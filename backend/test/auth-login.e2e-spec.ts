import request, { Response } from "supertest";
import { OrgRole } from "@prisma/client";
import { ThrottlerStorage, ThrottlerStorageService } from "@nestjs/throttler";
import { PrismaService } from "../src/prisma/prisma.service";
import { BcryptPasswordHasher } from "../src/common/security/password-hasher";
import { createTestingApp, TestingApp } from "./utils/testing-app";

const credentials = {
  email: "auth-login@example.com",
  password: "AuthLogin123!",
  organizationCode: "auth-login-org",
  fullName: "Auth Login Admin",
};

describe("Auth Login E2E", () => {
  let testing: TestingApp;
  let prisma: PrismaService;
  let passwordHasher: BcryptPasswordHasher;
  let throttlerStorage: ThrottlerStorageService;
  let organizationId: string;

  beforeAll(async () => {
    testing = await createTestingApp();
    prisma = testing.prisma;
    passwordHasher =
      testing.app.get<BcryptPasswordHasher>(BcryptPasswordHasher);
    throttlerStorage = testing.app.get(
      ThrottlerStorage,
    ) as ThrottlerStorageService;
  });

  afterAll(async () => {
    await testing.close();
  });

  beforeEach(async () => {
    await testing.resetDatabase();
    resetRateLimitState();
    organizationId = await seedOrganizationWithAdmin();
  });

  async function seedOrganizationWithAdmin(): Promise<string> {
    const org = await prisma.organization.create({
      data: {
        name: "Auth Login Org",
        code: credentials.organizationCode,
        description: "Organization for auth login E2E",
      },
    });

    const hashedPassword = await passwordHasher.hash(credentials.password);

    await prisma.user.create({
      data: {
        email: credentials.email,
        passwordHash: hashedPassword,
        fullName: credentials.fullName,
        organizationId: org.id,
        role: OrgRole.OWNER,
        isActive: true,
      },
    });

    return org.id;
  }

  type LoginOverride = Partial<
    Pick<typeof credentials, "email" | "password" | "organizationCode">
  >;

  const performLogin = (override: LoginOverride = {}) =>
    request(testing.httpServer)
      .post("/auth/login")
      .send({
        email: credentials.email,
        password: credentials.password,
        organizationCode: credentials.organizationCode,
        ...override,
      });

  function resetRateLimitState() {
    const storage = throttlerStorage.storage;
    storage.clear();

    const timeoutMap = (
      throttlerStorage as unknown as {
        timeoutIds: Map<string, NodeJS.Timeout[]>;
      }
    ).timeoutIds;

    if (timeoutMap) {
      timeoutMap.forEach((timeouts) =>
        timeouts.forEach((id) => clearTimeout(id)),
      );
      timeoutMap.clear();
    }
  }

  it("should login successfully and fetch /auth/me", async () => {
    const loginResponse = await performLogin().expect(201);

    expect(loginResponse.body).toBeDefined();
    expect(loginResponse.body.accessToken).toBeDefined();
    expect(loginResponse.body.user).toBeDefined();
    expect(loginResponse.body.user.email).toBe(credentials.email);
    expect(loginResponse.body.user.organizationId).toBe(organizationId);
    expect(loginResponse.body.user.passwordHash).toBeUndefined();

    const meResponse = await request(testing.httpServer)
      .get("/auth/me")
      .set("Authorization", `Bearer ${loginResponse.body.accessToken}`)
      .expect(200);

    expect(meResponse.body).toBeDefined();
    expect(meResponse.body.email).toBe(credentials.email);
    expect(meResponse.body.organizationId).toBe(organizationId);
    expect(meResponse.body.passwordHash).toBeUndefined();
  });

  it("should reject login attempts with incorrect password", async () => {
    await performLogin({ password: "WrongPassword!" }).expect(401);
  });

  it("should reject login attempts with invalid organization code", async () => {
    await performLogin({ organizationCode: "non-existent-org" }).expect(400);
  });

  it("should rate limit repeated failed login attempts", async () => {
    let throttledResponse: Response | undefined;

    for (let attempt = 0; attempt < 10; attempt += 1) {
      const response = await performLogin({ password: "WrongPassword!" });
      if (response.status === 429) {
        throttledResponse = response;
        break;
      }
    }

    expect(throttledResponse).toBeDefined();
    expect(throttledResponse?.body.code).toBe("AUTH_RATE_LIMITED");
  });
});
