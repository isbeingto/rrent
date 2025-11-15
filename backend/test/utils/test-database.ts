import { PrismaService } from "../../src/prisma/prisma.service";

const deletionOrder = [
  (prisma: PrismaService) => prisma.auditLog.deleteMany(),
  (prisma: PrismaService) => prisma.payment.deleteMany(),
  (prisma: PrismaService) => prisma.lease.deleteMany(),
  (prisma: PrismaService) => prisma.unit.deleteMany(),
  (prisma: PrismaService) => prisma.tenant.deleteMany(),
  (prisma: PrismaService) => prisma.property.deleteMany(),
  (prisma: PrismaService) => prisma.user.deleteMany(),
  (prisma: PrismaService) => prisma.organization.deleteMany(),
];

export async function resetDatabase(prisma: PrismaService): Promise<void> {
  for (const wipe of deletionOrder) {
    await wipe(prisma);
  }
}
