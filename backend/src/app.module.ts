import { Module } from "@nestjs/common";
import { ConfigModule } from "@nestjs/config";
import { ThrottlerModule } from "@nestjs/throttler";
import { AppController } from "./app.controller";
import { AppService } from "./app.service";
import { HealthModule } from "./health/health.module";
import { DemoModule } from "./demo/demo.module";
import { UserModule } from "./modules/user/user.module";
import { PrismaModule } from "./prisma/prisma.module";
import { OrganizationModule } from "./modules/organization/organization.module";
import { PropertyModule } from "./modules/property/property.module";
import { UnitModule } from "./modules/unit/unit.module";
import { TenantModule } from "./modules/tenant/tenant.module";
import { LeaseModule } from "./modules/lease/lease.module";
import { PaymentModule } from "./modules/payment/payment.module";
import { AuthModule } from "./modules/auth/auth.module";
import { SchedulerModule } from "./scheduler/scheduler.module";

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: ".env",
    }),
    ThrottlerModule.forRoot({
      throttlers: [
        {
          name: "global",
          ttl: 60_000, // 60 seconds
          limit: 100, // 100 requests per window
        },
      ],
    }),
    PrismaModule,
    HealthModule,
    DemoModule,
    UserModule,
    OrganizationModule,
    PropertyModule,
    UnitModule,
    TenantModule,
    LeaseModule,
    PaymentModule,
    AuthModule,
    SchedulerModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
