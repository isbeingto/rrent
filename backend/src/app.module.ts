import { Module } from "@nestjs/common";
import { ConfigModule } from "@nestjs/config";
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

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: ".env",
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
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
