import { Module } from "@nestjs/common";
import { LeaseService } from "./lease.service";
import { LeaseController } from "./lease.controller";
import { PrismaModule } from "../../prisma/prisma.module";
import { AuditLogModule } from "../audit-log/audit-log.module";
import { AuthModule } from "../auth/auth.module";

@Module({
  imports: [PrismaModule, AuditLogModule, AuthModule],
  controllers: [LeaseController],
  providers: [LeaseService],
  exports: [LeaseService],
})
export class LeaseModule {}
