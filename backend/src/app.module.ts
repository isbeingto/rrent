import { Module } from "@nestjs/common";
import { ConfigModule } from "@nestjs/config";
import { APP_GUARD } from "@nestjs/core";
import { ThrottlerModule, ThrottlerGuard } from "@nestjs/throttler";
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

const envFiles = [".env"];
if (process.env.NODE_ENV) {
  envFiles.unshift(`.env.${process.env.NODE_ENV}`);
}

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: envFiles,
    }),
    ThrottlerModule.forRoot({
      throttlers: [
        {
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
  providers: [
    AppService,
    {
      provide: APP_GUARD,
      useClass: ThrottlerGuard,
    },
  ],
})
export class AppModule {}
