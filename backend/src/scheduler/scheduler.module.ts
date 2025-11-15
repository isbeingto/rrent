import { Module } from "@nestjs/common";
import { ScheduleModule } from "@nestjs/schedule";
import { PrismaModule } from "../prisma/prisma.module";
import { LeaseCron } from "./lease.cron";
import { PaymentCron } from "./payment.cron";

/**
 * 定时任务模块
 * 集中管理所有定时任务
 */
@Module({
  imports: [ScheduleModule.forRoot(), PrismaModule],
  providers: [LeaseCron, PaymentCron],
})
export class SchedulerModule {}
