import { PrismaClient, OrgRole } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting database seed...');

  // 1. 创建初始 Organization
  const org = await prisma.organization.upsert({
    where: { code: 'demo-org' },
    update: {},
    create: {
      name: 'Demo Organization',
      code: 'demo-org',
      description: 'Initial demo organization for RRent',
      timezone: 'Asia/Shanghai',
    },
  });
  console.log(`✓ Organization created: ${org.id} (${org.code})`);

  // 2. 创建 admin 用户
  const passwordHash = await bcrypt.hash('Password123!', 10);
  const admin = await prisma.user.upsert({
    where: { email: 'admin@example.com' },
    update: {},
    create: {
      organizationId: org.id,
      email: 'admin@example.com',
      passwordHash,
      fullName: 'Admin User',
      role: OrgRole.OWNER,
    },
  });
  console.log(`✓ Admin user created: ${admin.email}`);

  // 3. 创建 Property
  const property = await prisma.property.upsert({
    where: {
      organizationId_code: {
        organizationId: org.id,
        code: 'demo-property',
      },
    },
    update: {},
    create: {
      organizationId: org.id,
      name: 'Demo Property',
      code: 'demo-property',
      description: 'A demo apartment building',
      city: 'Shanghai',
      country: 'CN',
      timezone: 'Asia/Shanghai',
    },
  });
  console.log(`✓ Property created: ${property.id} (${property.code})`);

  // 4. 创建 Unit
  const unit = await prisma.unit.create({
    data: {
      propertyId: property.id,
      unitNumber: '101',
      name: 'Demo Unit 101',
      floor: 1,
      bedrooms: 2,
      bathrooms: 1,
      areaSqm: 80,
    },
  });
  console.log(`✓ Unit created: ${unit.id} (${unit.unitNumber})`);

  // 5. 创建 Tenant
  const tenant = await prisma.tenant.create({
    data: {
      organizationId: org.id,
      fullName: 'Demo Tenant',
      email: 'tenant@example.com',
      phone: '13800000000',
      idNumber: '110101199001011234',
    },
  });
  console.log(`✓ Tenant created: ${tenant.id} (${tenant.fullName})`);

  // 6. 创建 Lease
  const lease = await prisma.lease.create({
    data: {
      organizationId: org.id,
      propertyId: property.id,
      unitId: unit.id,
      tenantId: tenant.id,
      status: 'ACTIVE',
      billCycle: 'MONTHLY',
      startDate: new Date('2025-01-01'),
      endDate: new Date('2026-01-01'),
      rentAmount: 3000.0,
      depositAmount: 6000.0,
      currency: 'CNY',
    },
  });
  console.log(`✓ Lease created: ${lease.id} (status: ${lease.status})`);

  // 7. 创建 Payment
  const payment = await prisma.payment.create({
    data: {
      organizationId: org.id,
      leaseId: lease.id,
      type: 'RENT',
      status: 'PENDING',
      amount: 3000.0,
      currency: 'CNY',
      dueDate: new Date('2025-02-01'),
    },
  });
  console.log(`✓ Payment created: ${payment.id} (type: ${payment.type})`);

  console.log('\n✅ Seed completed successfully!');
  console.log({
    organizationId: org.id,
    adminEmail: admin.email,
    propertyId: property.id,
    unitId: unit.id,
    tenantId: tenant.id,
    leaseId: lease.id,
    paymentId: payment.id,
  });
}

main()
  .catch((e) => {
    console.error('❌ Seed failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
