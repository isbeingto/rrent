import { Injectable, Logger } from "@nestjs/common";
import { Cron, CronExpression } from "@nestjs/schedule";
import { PrismaService } from "../prisma/prisma.service";
import { LeaseStatus } from "@prisma/client";

/**
 * 租约定时任务
 * 负责自动处理过期租约
 */
@Injectable()
export class LeaseCron {
  private readonly logger = new Logger(LeaseCron.name);

  constructor(private readonly prisma: PrismaService) {}

  /**
   * 自动标记过期租约为 EXPIRED
   *
   * 执行频率：每小时一次
   * 业务逻辑：
   * - 查找所有 status=ACTIVE 且 endDate < now() 的租约
   * - 批量更新为 status=EXPIRED
   * - 幂等性：已经是 EXPIRED 的租约不会被重复处理
   */
  @Cron(CronExpression.EVERY_HOUR)
  async markExpiredLeases() {
    const now = new Date();

    try {
      const result = await this.prisma.lease.updateMany({
        where: {
          status: LeaseStatus.ACTIVE,
          endDate: {
            lt: now,
          },
        },
        data: {
          status: LeaseStatus.EXPIRED,
        },
      });

      if (result.count > 0) {
        this.logger.log(`LeaseCron: expired ${result.count} active leases`);
      }
    } catch (error) {
      this.logger.error(
        `LeaseCron: failed to mark expired leases`,
        error instanceof Error ? error.stack : String(error),
      );
    }
  }
}
