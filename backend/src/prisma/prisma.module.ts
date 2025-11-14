import { Module } from "@nestjs/common";
import { PrismaService } from "./prisma.service";
import { TenantContext } from "../common/tenant/tenant-context";

@Module({
  providers: [TenantContext, PrismaService],
  exports: [TenantContext, PrismaService],
})
export class PrismaModule {}
