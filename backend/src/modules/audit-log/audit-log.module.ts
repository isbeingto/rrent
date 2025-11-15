import { Module } from "@nestjs/common";
import { PrismaModule } from "../../prisma/prisma.module";
import { AuditLogService } from "./audit-log.service";

/**
 * 审计日志模块
 * 提供审计日志服务，供其他模块导入使用
 */
@Module({
  imports: [PrismaModule],
  providers: [AuditLogService],
  exports: [AuditLogService],
})
export class AuditLogModule {}
