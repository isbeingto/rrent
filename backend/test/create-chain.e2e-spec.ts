import request from "supertest";
import { BillCycle, LeaseStatus, OrgRole } from "@prisma/client";
import { BcryptPasswordHasher } from "../src/common/security/password-hasher";
import { PrismaService } from "../src/prisma/prisma.service";
import { createTestingApp, TestingApp } from "./utils/testing-app";

interface SeededAdmin {
  organizationId: string;
  email: string;
  password: string;
  organizationCode: string;
}

describe("Create Chain E2E", () => {
  let testing: TestingApp;
  let prisma: PrismaService;
  let passwordHasher: BcryptPasswordHasher;
  let admin: SeededAdmin;

  beforeAll(async () => {
    testing = await createTestingApp();
    prisma = testing.prisma;
    passwordHasher =
      testing.app.get<BcryptPasswordHasher>(BcryptPasswordHasher);
  });

  afterAll(async () => {
    await testing.close();
  });

  beforeEach(async () => {
    await testing.resetDatabase();
    admin = await seedOrganizationWithAdmin();
  });

  async function seedOrganizationWithAdmin(): Promise<SeededAdmin> {
    const org = await prisma.organization.create({
      data: {
        name: "Create Chain Org",
        code: "create-chain-org",
        description: "Organization for create chain E2E",
      },
    });

    const email = "create-chain-admin@example.com";
    const password = "CreateChain123!";

    const hashedPassword = await passwordHasher.hash(password);

    await prisma.user.create({
      data: {
        email,
        passwordHash: hashedPassword,
        fullName: "Create Chain Admin",
        organizationId: org.id,
        role: OrgRole.OWNER,
        isActive: true,
      },
    });

    return {
      organizationId: org.id,
      email,
      password,
      organizationCode: org.code,
    };
  }

  async function authenticate(): Promise<string> {
    const response = await request(testing.httpServer)
      .post("/auth/login")
      .send({
        email: admin.email,
        password: admin.password,
        organizationCode: admin.organizationCode,
      })
      .expect(201);

    return response.body.accessToken as string;
  }

  const authHeader = (token: string) => ({
    Authorization: `Bearer ${token}`,
  });

  it("should create property, unit, tenant, and lease sequentially", async () => {
    const token = await authenticate();

    const propertyResponse = await request(testing.httpServer)
      .post("/properties")
      .set(authHeader(token))
      .send({
        organizationId: admin.organizationId,
        name: "Create Chain Property",
        code: "CREATE-CHAIN-PROP",
        description: "Property for create chain",
        city: "Shanghai",
        country: "CN",
      })
      .expect(201);

    expect(propertyResponse.body.organizationId).toBe(admin.organizationId);
    const propertyId = propertyResponse.body.id as string;

    const unitResponse = await request(testing.httpServer)
      .post("/units")
      .set(authHeader(token))
      .query({ organizationId: admin.organizationId })
      .send({
        propertyId,
        unitNumber: "CHAIN-UNIT-101",
        floor: 10,
        bedrooms: 2,
        bathrooms: 1,
        areaSqm: 80,
      })
      .expect(201);

    expect(unitResponse.body.propertyId).toBe(propertyId);
    const unitId = unitResponse.body.id as string;

    const tenantResponse = await request(testing.httpServer)
      .post("/tenants")
      .set(authHeader(token))
      .send({
        organizationId: admin.organizationId,
        fullName: "Create Chain Tenant",
        email: "create-chain-tenant@example.com",
        phone: "13800000000",
        idNumber: "CHAIN-TENANT-ID",
      })
      .expect(201);

    expect(tenantResponse.body.organizationId).toBe(admin.organizationId);
    const tenantId = tenantResponse.body.id as string;

    const startDate = new Date("2025-01-01").toISOString();
    const endDate = new Date("2025-12-31").toISOString();

    const leaseResponse = await request(testing.httpServer)
      .post("/leases")
      .set(authHeader(token))
      .send({
        organizationId: admin.organizationId,
        propertyId,
        unitId,
        tenantId,
        status: LeaseStatus.PENDING,
        billCycle: BillCycle.MONTHLY,
        startDate,
        endDate,
        rentAmount: 5500,
        depositAmount: 5500,
        currency: "CNY",
      })
      .expect(201);

    expect(leaseResponse.body.organizationId).toBe(admin.organizationId);
    expect(leaseResponse.body.propertyId).toBe(propertyId);
    expect(leaseResponse.body.unitId).toBe(unitId);
    expect(leaseResponse.body.tenantId).toBe(tenantId);
    expect(leaseResponse.body.status).toBe(LeaseStatus.PENDING);

    const leaseGetResponse = await request(testing.httpServer)
      .get(`/leases/${leaseResponse.body.id}`)
      .set(authHeader(token))
      .query({ organizationId: admin.organizationId })
      .expect(200);

    expect(leaseGetResponse.body.id).toBe(leaseResponse.body.id);
    expect(leaseGetResponse.body.organizationId).toBe(admin.organizationId);
    expect(leaseGetResponse.body.propertyId).toBe(propertyId);
    expect(leaseGetResponse.body.unitId).toBe(unitId);
    expect(leaseGetResponse.body.tenantId).toBe(tenantId);
  });

  it("should reject cross-tenant resource usage", async () => {
    const token = await authenticate();

    const propertyResponse = await request(testing.httpServer)
      .post("/properties")
      .set(authHeader(token))
      .send({
        organizationId: admin.organizationId,
        name: "Primary Property",
        code: "PRIMARY-PROP",
        city: "Shanghai",
      })
      .expect(201);

    const otherOrg = await prisma.organization.create({
      data: {
        name: "Other Org",
        code: "other-org",
      },
    });

    const crossTenantResponse = await request(testing.httpServer)
      .post("/units")
      .set(authHeader(token))
      .query({ organizationId: otherOrg.id })
      .send({
        propertyId: propertyResponse.body.id,
        unitNumber: "CHAIN-UNIT-999",
      })
      .expect(404);

    expect(crossTenantResponse.body.code).toBe("PROPERTY_NOT_FOUND");
  });
});
