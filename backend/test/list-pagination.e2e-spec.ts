/* eslint-disable @typescript-eslint/no-explicit-any */
import { Test, TestingModule } from "@nestjs/testing";
import { INestApplication, ValidationPipe } from "@nestjs/common";
import * as request from "supertest";
import { AppModule } from "../src/app.module";
import { PrismaService } from "../src/prisma/prisma.service";
import {
  Organization,
  Property,
  Tenant,
  Lease,
  Payment,
  LeaseStatus,
  PaymentStatus,
  OrgRole,
} from "@prisma/client";

describe("BE-5-50: List Pagination E2E", () => {
  let app: INestApplication;
  let prisma: PrismaService;
  let authToken: string;
  let organization: Organization;
  let property: Property;
  let tenant: Tenant;
  let lease: Lease;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(
      new ValidationPipe({
        transform: true,
        whitelist: true,
      }),
    );
    await app.init();

    prisma = app.get<PrismaService>(PrismaService);

    // Clean up existing test data
    await prisma.payment.deleteMany({});
    await prisma.lease.deleteMany({});
    await prisma.tenant.deleteMany({});
    await prisma.unit.deleteMany({});
    await prisma.property.deleteMany({});
    await prisma.user.deleteMany({});
    await prisma.organization.deleteMany({});

    // Create test organization
    organization = await prisma.organization.create({
      data: {
        name: "Test Org for Pagination",
        code: "TESTPAGE",
        timezone: "Asia/Shanghai",
      },
    });

    // Create test user for authentication
    const user = await prisma.user.create({
      data: {
        username: "testuser_pagination",
        email: "testuser_pagination@example.com",
        passwordHash: "$2b$10$dummyhashfortest",
        organizationId: organization.id,
        role: OrgRole.OWNER,
      },
    });

    // Get auth token
    const authResponse = await request(app.getHttpServer())
      .post("/auth/login")
      .send({
        username: "testuser_pagination",
        password: "TestPassword123!",
      });

    // For testing purposes, we'll use a mock token or skip auth
    // In real scenario, you'd need proper authentication
    authToken = "mock-token";

    // Create test property
    property = await prisma.property.create({
      data: {
        name: "Test Property",
        code: "PROP001",
        organizationId: organization.id,
        addressLine1: "123 Test Street",
        city: "Test City",
        state: "TS",
        postalCode: "12345",
        country: "Test Country",
      },
    });

    // Create multiple tenants for testing
    for (let i = 1; i <= 15; i++) {
      await prisma.tenant.create({
        data: {
          fullName: i <= 5 ? `Alice Tenant ${i}` : `Bob Tenant ${i}`,
          email: `tenant${i}@example.com`,
          phone: `+1234567890${i}`,
          organizationId: organization.id,
          createdAt: new Date(Date.now() - i * 24 * 60 * 60 * 1000), // Different dates
        },
      });
    }

    tenant = await prisma.tenant.findFirst({
      where: { organizationId: organization.id },
    });

    // Create units
    for (let i = 1; i <= 10; i++) {
      await prisma.unit.create({
        data: {
          unitNumber: `Unit-${i}`,
          propertyId: property.id,
        },
      });
    }

    const unit = await prisma.unit.findFirst({
      where: { propertyId: property.id },
    });

    // Create leases with different statuses
    for (let i = 0; i < 8; i++) {
      await prisma.lease.create({
        data: {
          organizationId: organization.id,
          propertyId: property.id,
          unitId: unit!.id,
          tenantId: tenant!.id,
          startDate: new Date("2024-01-01"),
          endDate: new Date("2024-12-31"),
          rentAmount: 1000 + i * 100,
          status: i < 4 ? LeaseStatus.ACTIVE : LeaseStatus.PENDING,
          createdAt: new Date(Date.now() - i * 24 * 60 * 60 * 1000),
        },
      });
    }

    lease = await prisma.lease.findFirst({
      where: { organizationId: organization.id, status: LeaseStatus.ACTIVE },
    });

    // Create payments with different statuses and due dates
    for (let i = 0; i < 12; i++) {
      await prisma.payment.create({
        data: {
          organizationId: organization.id,
          leaseId: lease!.id,
          dueDate: new Date(Date.now() - i * 7 * 24 * 60 * 60 * 1000),
          amount: 1000,
          status: i < 6 ? PaymentStatus.PENDING : PaymentStatus.PAID,
          createdAt: new Date(Date.now() - i * 24 * 60 * 60 * 1000),
        },
      });
    }
  });

  afterAll(async () => {
    await prisma.payment.deleteMany({});
    await prisma.lease.deleteMany({});
    await prisma.tenant.deleteMany({});
    await prisma.unit.deleteMany({});
    await prisma.property.deleteMany({});
    await prisma.user.deleteMany({});
    await prisma.organization.deleteMany({});
    await app.close();
  });

  describe("1️⃣ Basic Pagination", () => {
    it("should return correct number of items per page", async () => {
      const response = await request(app.getHttpServer())
        .get("/tenants")
        .query({
          organizationId: organization.id,
          page: 1,
          pageSize: 5,
        });

      expect(response.status).toBe(200);
      expect(response.body.items).toHaveLength(5);
      expect(response.body.meta.page).toBe(1);
      expect(response.body.meta.limit).toBe(5);
    });

    it("should have correct total count in meta", async () => {
      const response = await request(app.getHttpServer())
        .get("/tenants")
        .query({
          organizationId: organization.id,
          page: 1,
          pageSize: 5,
        });

      expect(response.status).toBe(200);
      expect(response.body.meta.total).toBeGreaterThanOrEqual(15);
      expect(response.body.meta.pageCount).toBeGreaterThanOrEqual(3);
    });

    it("should set X-Total-Count header", async () => {
      const response = await request(app.getHttpServer())
        .get("/tenants")
        .query({
          organizationId: organization.id,
          page: 1,
          pageSize: 5,
        });

      expect(response.status).toBe(200);
      expect(response.headers["x-total-count"]).toBeDefined();
      expect(response.headers["x-total-count"]).toBe(
        response.body.meta.total.toString(),
      );
    });

    it("should return correct page with pagination", async () => {
      const response = await request(app.getHttpServer())
        .get("/tenants")
        .query({
          organizationId: organization.id,
          page: 2,
          pageSize: 5,
        });

      expect(response.status).toBe(200);
      expect(response.body.items).toHaveLength(5);
      expect(response.body.meta.page).toBe(2);
    });
  });

  describe("2️⃣ Keyword Search", () => {
    it("should filter tenants by keyword", async () => {
      const response = await request(app.getHttpServer())
        .get("/tenants")
        .query({
          organizationId: organization.id,
          keyword: "Alice",
          page: 1,
          pageSize: 20,
        });

      expect(response.status).toBe(200);
      expect(response.body.items.length).toBeGreaterThan(0);
      expect(
        response.body.items.every((t: Tenant) => t.fullName.includes("Alice")),
      ).toBe(true);
    });

    it("should filter properties by keyword (name/code/address)", async () => {
      const response = await request(app.getHttpServer())
        .get("/properties")
        .query({
          organizationId: organization.id,
          keyword: "Test",
          page: 1,
          pageSize: 20,
        });

      expect(response.status).toBe(200);
      expect(response.body.items.length).toBeGreaterThan(0);
    });

    it("should return empty array for non-matching keyword", async () => {
      const response = await request(app.getHttpServer())
        .get("/tenants")
        .query({
          organizationId: organization.id,
          keyword: "NonExistent999",
          page: 1,
          pageSize: 20,
        });

      expect(response.status).toBe(200);
      expect(response.body.items).toHaveLength(0);
      expect(response.body.meta.total).toBe(0);
    });
  });

  describe("3️⃣ Status Filter", () => {
    it("should filter leases by ACTIVE status", async () => {
      const response = await request(app.getHttpServer())
        .get("/leases")
        .query({
          organizationId: organization.id,
          status: LeaseStatus.ACTIVE,
          page: 1,
          pageSize: 20,
        });

      expect(response.status).toBe(200);
      expect(response.body.items.length).toBeGreaterThan(0);
      expect(
        response.body.items.every(
          (l: Lease) => l.status === LeaseStatus.ACTIVE,
        ),
      ).toBe(true);
    });

    it("should filter leases by PENDING status", async () => {
      const response = await request(app.getHttpServer())
        .get("/leases")
        .query({
          organizationId: organization.id,
          status: LeaseStatus.PENDING,
          page: 1,
          pageSize: 20,
        });

      expect(response.status).toBe(200);
      expect(response.body.items.length).toBeGreaterThan(0);
      expect(
        response.body.items.every(
          (l: Lease) => l.status === LeaseStatus.PENDING,
        ),
      ).toBe(true);
    });

    it("should filter payments by PAID status", async () => {
      const response = await request(app.getHttpServer())
        .get("/payments")
        .query({
          organizationId: organization.id,
          status: PaymentStatus.PAID,
          page: 1,
          pageSize: 20,
        });

      expect(response.status).toBe(200);
      expect(response.body.items.length).toBeGreaterThan(0);
      expect(
        response.body.items.every(
          (p: Payment) => p.status === PaymentStatus.PAID,
        ),
      ).toBe(true);
    });

    it("should filter payments by PENDING status", async () => {
      const response = await request(app.getHttpServer())
        .get("/payments")
        .query({
          organizationId: organization.id,
          status: PaymentStatus.PENDING,
          page: 1,
          pageSize: 20,
        });

      expect(response.status).toBe(200);
      expect(response.body.items.length).toBeGreaterThan(0);
      expect(
        response.body.items.every(
          (p: Payment) => p.status === PaymentStatus.PENDING,
        ),
      ).toBe(true);
    });
  });

  describe("4️⃣ Date Range Filter", () => {
    it("should filter by date range (last 7 days)", async () => {
      const dateEnd = new Date();
      const dateStart = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);

      const response = await request(app.getHttpServer())
        .get("/tenants")
        .query({
          organizationId: organization.id,
          dateStart: dateStart.toISOString(),
          dateEnd: dateEnd.toISOString(),
          page: 1,
          pageSize: 20,
        });

      expect(response.status).toBe(200);
      expect(
        response.body.items.every((t: Tenant) => {
          const createdAt = new Date(t.createdAt);
          return createdAt >= dateStart && createdAt <= dateEnd;
        }),
      ).toBe(true);
    });

    it("should filter payments by date range", async () => {
      const dateEnd = new Date();
      const dateStart = new Date(Date.now() - 14 * 24 * 60 * 60 * 1000);

      const response = await request(app.getHttpServer())
        .get("/payments")
        .query({
          organizationId: organization.id,
          dateStart: dateStart.toISOString(),
          dateEnd: dateEnd.toISOString(),
          page: 1,
          pageSize: 20,
        });

      expect(response.status).toBe(200);
      expect(response.body.items.length).toBeGreaterThan(0);
    });

    it("should filter by dateStart only", async () => {
      const dateStart = new Date(Date.now() - 5 * 24 * 60 * 60 * 1000);

      const response = await request(app.getHttpServer())
        .get("/tenants")
        .query({
          organizationId: organization.id,
          dateStart: dateStart.toISOString(),
          page: 1,
          pageSize: 20,
        });

      expect(response.status).toBe(200);
      expect(
        response.body.items.every((t: Tenant) => {
          const createdAt = new Date(t.createdAt);
          return createdAt >= dateStart;
        }),
      ).toBe(true);
    });

    it("should filter by dateEnd only", async () => {
      const dateEnd = new Date(Date.now() - 10 * 24 * 60 * 60 * 1000);

      const response = await request(app.getHttpServer())
        .get("/tenants")
        .query({
          organizationId: organization.id,
          dateEnd: dateEnd.toISOString(),
          page: 1,
          pageSize: 20,
        });

      expect(response.status).toBe(200);
      if (response.body.items.length > 0) {
        expect(
          response.body.items.every((t: Tenant) => {
            const createdAt = new Date(t.createdAt);
            return createdAt <= dateEnd;
          }),
        ).toBe(true);
      }
    });
  });

  describe("5️⃣ Sorting", () => {
    it("should sort by createdAt ascending", async () => {
      const response = await request(app.getHttpServer())
        .get("/tenants")
        .query({
          organizationId: organization.id,
          sort: "createdAt",
          order: "asc",
          page: 1,
          pageSize: 20,
        });

      expect(response.status).toBe(200);
      if (response.body.items.length > 1) {
        const dates = response.body.items.map((t: Tenant) =>
          new Date(t.createdAt).getTime(),
        );
        for (let i = 1; i < dates.length; i++) {
          expect(dates[i]).toBeGreaterThanOrEqual(dates[i - 1]);
        }
      }
    });

    it("should sort by createdAt descending (default)", async () => {
      const response = await request(app.getHttpServer())
        .get("/tenants")
        .query({
          organizationId: organization.id,
          sort: "createdAt",
          order: "desc",
          page: 1,
          pageSize: 20,
        });

      expect(response.status).toBe(200);
      if (response.body.items.length > 1) {
        const dates = response.body.items.map((t: Tenant) =>
          new Date(t.createdAt).getTime(),
        );
        for (let i = 1; i < dates.length; i++) {
          expect(dates[i]).toBeLessThanOrEqual(dates[i - 1]);
        }
      }
    });
  });

  describe("6️⃣ Combined Filters", () => {
    it("should combine pagination, keyword, and date filter", async () => {
      const dateStart = new Date(Date.now() - 10 * 24 * 60 * 60 * 1000);

      const response = await request(app.getHttpServer())
        .get("/tenants")
        .query({
          organizationId: organization.id,
          keyword: "Tenant",
          dateStart: dateStart.toISOString(),
          page: 1,
          pageSize: 5,
        });

      expect(response.status).toBe(200);
      expect(response.body.items.length).toBeLessThanOrEqual(5);
      expect(response.body.meta.page).toBe(1);
      expect(response.body.meta.limit).toBe(5);
      expect(response.headers["x-total-count"]).toBeDefined();
    });

    it("should combine status and date filter for leases", async () => {
      const dateStart = new Date(Date.now() - 10 * 24 * 60 * 60 * 1000);

      const response = await request(app.getHttpServer())
        .get("/leases")
        .query({
          organizationId: organization.id,
          status: LeaseStatus.ACTIVE,
          dateStart: dateStart.toISOString(),
          page: 1,
          pageSize: 20,
        });

      expect(response.status).toBe(200);
      expect(
        response.body.items.every(
          (l: Lease) => l.status === LeaseStatus.ACTIVE,
        ),
      ).toBe(true);
    });

    it("should combine pagination, status filter, and sorting", async () => {
      const response = await request(app.getHttpServer())
        .get("/payments")
        .query({
          organizationId: organization.id,
          status: PaymentStatus.PAID,
          sort: "dueDate",
          order: "desc",
          page: 1,
          pageSize: 3,
        });

      expect(response.status).toBe(200);
      expect(response.body.items.length).toBeLessThanOrEqual(3);
      expect(
        response.body.items.every(
          (p: Payment) => p.status === PaymentStatus.PAID,
        ),
      ).toBe(true);
    });
  });

  describe("7️⃣ Tenant Isolation", () => {
    it("should not return data from other organizations", async () => {
      // Create another organization
      const otherOrg = await prisma.organization.create({
        data: {
          name: "Other Organization",
          code: "OTHER_ORG",
          timezone: "Asia/Shanghai",
        },
      });

      // Create tenant in other org
      await prisma.tenant.create({
        data: {
          fullName: "Other Org Tenant",
          email: "other@example.com",
          phone: "+9999999999",
          organizationId: otherOrg.id,
        },
      });

      // Query with first org ID
      const response = await request(app.getHttpServer())
        .get("/tenants")
        .query({
          organizationId: organization.id,
          page: 1,
          pageSize: 100,
        });

      expect(response.status).toBe(200);
      expect(
        response.body.items.every(
          (t: Tenant) => t.organizationId === organization.id,
        ),
      ).toBe(true);
      expect(
        response.body.items.some(
          (t: Tenant) => t.fullName === "Other Org Tenant",
        ),
      ).toBe(false);

      // Cleanup
      await prisma.tenant.deleteMany({ where: { organizationId: otherOrg.id } });
      await prisma.organization.delete({ where: { id: otherOrg.id } });
    });

    it("should properly isolate properties by organization", async () => {
      const response = await request(app.getHttpServer())
        .get("/properties")
        .query({
          organizationId: organization.id,
          page: 1,
          pageSize: 100,
        });

      expect(response.status).toBe(200);
      expect(
        response.body.items.every(
          (p: Property) => p.organizationId === organization.id,
        ),
      ).toBe(true);
    });
  });

  describe("8️⃣ Multiple Module Cross-Test", () => {
    it("should properly paginate organization list", async () => {
      const response = await request(app.getHttpServer())
        .get("/organizations")
        .query({
          page: 1,
          pageSize: 10,
        });

      expect(response.status).toBe(200);
      expect(response.body.items).toBeDefined();
      expect(response.body.meta).toBeDefined();
      expect(response.headers["x-total-count"]).toBeDefined();
    });

    it("should properly paginate lease list with filters", async () => {
      const response = await request(app.getHttpServer())
        .get("/leases")
        .query({
          organizationId: organization.id,
          status: LeaseStatus.ACTIVE,
          page: 1,
          pageSize: 5,
        });

      expect(response.status).toBe(200);
      expect(response.body.items).toBeDefined();
      expect(response.body.meta).toBeDefined();
      expect(response.body.meta.limit).toBe(5);
      expect(response.headers["x-total-count"]).toBeDefined();
    });

    it("should properly paginate payment list with date filter", async () => {
      const response = await request(app.getHttpServer())
        .get("/payments")
        .query({
          organizationId: organization.id,
          dueDateFrom: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
          page: 1,
          pageSize: 10,
        });

      expect(response.status).toBe(200);
      expect(response.body.items).toBeDefined();
      expect(response.body.meta).toBeDefined();
      expect(response.headers["x-total-count"]).toBeDefined();
    });
  });

  describe("9️⃣ Edge Cases", () => {
    it("should handle page beyond available pages", async () => {
      const response = await request(app.getHttpServer())
        .get("/tenants")
        .query({
          organizationId: organization.id,
          page: 999,
          pageSize: 10,
        });

      expect(response.status).toBe(200);
      expect(response.body.items).toHaveLength(0);
    });

    it("should handle invalid date format gracefully", async () => {
      const response = await request(app.getHttpServer())
        .get("/tenants")
        .query({
          organizationId: organization.id,
          dateStart: "invalid-date",
          page: 1,
          pageSize: 10,
        });

      // Should either return 400 or ignore invalid date
      expect([200, 400]).toContain(response.status);
    });

    it("should handle pageSize of 1", async () => {
      const response = await request(app.getHttpServer())
        .get("/tenants")
        .query({
          organizationId: organization.id,
          page: 1,
          pageSize: 1,
        });

      expect(response.status).toBe(200);
      expect(response.body.items).toHaveLength(1);
    });

    it("should handle large pageSize", async () => {
      const response = await request(app.getHttpServer())
        .get("/tenants")
        .query({
          organizationId: organization.id,
          page: 1,
          pageSize: 100,
        });

      expect(response.status).toBe(200);
      expect(response.body.items.length).toBeLessThanOrEqual(100);
    });
  });

  describe("🔟 Response Format Validation", () => {
    it("should return correct response structure", async () => {
      const response = await request(app.getHttpServer())
        .get("/tenants")
        .query({
          organizationId: organization.id,
          page: 1,
          pageSize: 5,
        });

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty("items");
      expect(response.body).toHaveProperty("meta");
      expect(response.body.meta).toHaveProperty("total");
      expect(response.body.meta).toHaveProperty("page");
      expect(response.body.meta).toHaveProperty("limit");
      expect(response.body.meta).toHaveProperty("pageCount");
    });

    it("should have consistent Content-Type", async () => {
      const response = await request(app.getHttpServer())
        .get("/tenants")
        .query({
          organizationId: organization.id,
          page: 1,
          pageSize: 5,
        });

      expect(response.status).toBe(200);
      expect(response.headers["content-type"]).toMatch(/application\/json/);
    });

    it("should include X-Total-Count in all list endpoints", async () => {
      const endpoints = [
        { path: "/organizations", query: {} },
        {
          path: "/properties",
          query: { organizationId: organization.id },
        },
        { path: "/tenants", query: { organizationId: organization.id } },
        { path: "/leases", query: { organizationId: organization.id } },
        { path: "/payments", query: { organizationId: organization.id } },
      ];

      for (const endpoint of endpoints) {
        const response = await request(app.getHttpServer())
          .get(endpoint.path)
          .query({ ...endpoint.query, page: 1, pageSize: 5 });

        expect(response.headers["x-total-count"]).toBeDefined();
        expect(Number(response.headers["x-total-count"])).toBeGreaterThanOrEqual(
          0,
        );
      }
    });
  });
});
