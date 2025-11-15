import { Injectable, Logger } from "@nestjs/common";
import { Cron } from "@nestjs/schedule";
import { PrismaService } from "../prisma/prisma.service";
import { PaymentStatus } from "@prisma/client";

/**
 * 支付单定时任务
 * 负责自动标记逾期的支付单
 */
@Injectable()
export class PaymentCron {
  private readonly logger = new Logger(PaymentCron.name);

  constructor(private readonly prisma: PrismaService) {}

  /**
   * 自动标记逾期支付单为 OVERDUE
   *
   * 执行频率：每10分钟一次
   * 业务逻辑：
   * - 查找所有 status=PENDING 且 dueDate < now() 的支付单
   * - 批量更新为 status=OVERDUE
   * - 幂等性：已经是 OVERDUE/PAID/CANCELLED 的支付单不会被重复处理
   */
  @Cron("*/10 * * * *")
  async markOverduePayments() {
    const now = new Date();

    try {
      const result = await this.prisma.payment.updateMany({
        where: {
          status: PaymentStatus.PENDING,
          dueDate: {
            lt: now,
          },
        },
        data: {
          status: PaymentStatus.OVERDUE,
        },
      });

      if (result.count > 0) {
        this.logger.log(
          `PaymentCron: marked ${result.count} payments as OVERDUE`,
        );
      }
    } catch (error) {
      this.logger.error(
        `PaymentCron: failed to mark overdue payments`,
        error instanceof Error ? error.stack : String(error),
      );
    }
  }
}
