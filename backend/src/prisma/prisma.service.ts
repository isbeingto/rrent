import { Injectable, OnModuleInit } from "@nestjs/common";
import { PrismaClient } from "@prisma/client";
import { TenantContext } from "../common/tenant/tenant-context";
import { createTenantMiddleware } from "./tenant-middleware";

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit {
  constructor(private readonly tenantContext: TenantContext) {
    super();

    // 注册租户中间件
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (this as any).$use(createTenantMiddleware(this.tenantContext));
  }

  async onModuleInit() {
    await this.$connect();
  }

  async onModuleDestroy() {
    await this.$disconnect();
  }
}
