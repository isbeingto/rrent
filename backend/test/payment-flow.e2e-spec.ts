import { INestApplication } from "@nestjs/common";
import request from "supertest";
import { BillCycle, BillType, OrgRole, PaymentStatus } from "@prisma/client";
import { PaymentCron } from "../src/scheduler/payment.cron";
import { BcryptPasswordHasher } from "../src/common/security/password-hasher";
import { createTestingApp, TestingApp } from "./utils/testing-app";

describe("BE-7-62: Payment Flow E2E", () => {
  let testing: TestingApp;
  let app: INestApplication;
  let prisma: TestingApp["prisma"];
  let passwordHasher: BcryptPasswordHasher;
  let jwtToken: string;
  let organizationId: string;
  let propertyId: string;
  let unitId: string;
  let tenantId: string;

  const testUser = {
    email: "payment-flow-user@example.com",
    password: "PaymentFlow123!",
    fullName: "Payment Flow Tester",
    organizationCode: "PAYMENTFLOW",
    role: OrgRole.OPERATOR,
  };

  beforeAll(async () => {
    testing = await createTestingApp();
    app = testing.app;
    prisma = testing.prisma;
    passwordHasher = app.get(BcryptPasswordHasher);
  });

  beforeEach(async () => {
    await testing.resetDatabase();

    const organization = await prisma.organization.create({
      data: {
        name: "Payment Flow Org",
        code: testUser.organizationCode,
        timezone: "Asia/Shanghai",
      },
    });
    organizationId = organization.id;

    const property = await prisma.property.create({
      data: {
        name: "Payment Flow Property",
        code: "PAYFLOW-PROP",
        organizationId,
      },
    });
    propertyId = property.id;

    const unit = await prisma.unit.create({
      data: {
        unitNumber: "101",
        propertyId,
      },
    });
    unitId = unit.id;

    const tenant = await prisma.tenant.create({
      data: {
        fullName: "Payment Flow Tenant",
        email: "tenant-payment@example.com",
        organizationId,
      },
    });
    tenantId = tenant.id;

    await prisma.user.create({
      data: {
        email: testUser.email,
        passwordHash: await passwordHasher.hash(testUser.password),
        fullName: testUser.fullName,
        role: testUser.role,
        organizationId,
      },
    });

    const loginResp = await request(app.getHttpServer())
      .post("/auth/login")
      .send({
        email: testUser.email,
        password: testUser.password,
        organizationCode: testUser.organizationCode,
      })
      .expect(201);

    jwtToken = loginResp.body.accessToken;
  });

  afterAll(async () => {
    await testing.resetDatabase();
    await testing.close();
  });

  const createPendingLease = async () => {
    const response = await request(app.getHttpServer())
      .post("/leases")
      .set("Authorization", `Bearer ${jwtToken}`)
      .send({
        organizationId,
        propertyId,
        unitId,
        tenantId,
        billCycle: BillCycle.MONTHLY,
        startDate: new Date().toISOString(),
        endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
        rentAmount: 2000,
      })
      .expect(201);

    return response.body;
  };

  it("creates a lease, activates it, and marks a bill as paid", async () => {
    const lease = await createPendingLease();

    await request(app.getHttpServer())
      .post(`/leases/${lease.id}/activate`)
      .set("Authorization", `Bearer ${jwtToken}`)
      .expect(201);

    const payments = await prisma.payment.findMany({
      where: { leaseId: lease.id },
      orderBy: { dueDate: "asc" },
    });

    expect(payments.length).toBeGreaterThan(0);

    const markPaidResponse = await request(app.getHttpServer())
      .post(`/payments/${payments[0].id}/mark-paid`)
      .set("Authorization", `Bearer ${jwtToken}`)
      .expect(201);

    expect(markPaidResponse.body.status).toBe(PaymentStatus.PAID);

    const repeatedResponse = await request(app.getHttpServer())
      .post(`/payments/${payments[0].id}/mark-paid`)
      .set("Authorization", `Bearer ${jwtToken}`)
      .expect(201);

    expect(repeatedResponse.body.status).toBe(PaymentStatus.PAID);
    expect(repeatedResponse.body.paidAt).toBe(markPaidResponse.body.paidAt);
  });

  it("rejects mark-paid when payment status is invalid", async () => {
    const lease = await prisma.lease.create({
      data: {
        organizationId,
        propertyId,
        unitId,
        tenantId,
        billCycle: BillCycle.MONTHLY,
        startDate: new Date().toISOString(),
        endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
        rentAmount: 1000,
      },
    });

    const invalidPayment = await prisma.payment.create({
      data: {
        organizationId,
        leaseId: lease.id,
        type: BillType.RENT,
        amount: 1000,
        dueDate: new Date(),
        status: PaymentStatus.CANCELED,
      },
    });

    await request(app.getHttpServer())
      .post(`/payments/${invalidPayment.id}/mark-paid`)
      .set("Authorization", `Bearer ${jwtToken}`)
      .expect(409);
  });

  it("flags overdue payments via cron handler", async () => {
    const lease = await createPendingLease();

    await request(app.getHttpServer())
      .post(`/leases/${lease.id}/activate`)
      .set("Authorization", `Bearer ${jwtToken}`)
      .expect(201);

    const overduePayment = await prisma.payment.create({
      data: {
        organizationId,
        leaseId: lease.id,
        type: BillType.RENT,
        amount: 1200,
        dueDate: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
        status: PaymentStatus.PENDING,
      },
    });

    const paymentCron = app.get(PaymentCron);
    await paymentCron.markOverduePayments();

    const updated = await prisma.payment.findUniqueOrThrow({
      where: { id: overduePayment.id },
    });

    expect(updated.status).toBe(PaymentStatus.OVERDUE);
  });
});
