import { Injectable, OnModuleInit } from "@nestjs/common";
import { PrismaClient } from "@prisma/client";
import { TenantContext } from "../common/tenant/tenant-context";
import { createTenantExtension } from "./tenant-middleware";

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit {
  constructor(private readonly tenantContext: TenantContext) {
    super();

    const extended = this.$extends(
      createTenantExtension(this.tenantContext),
    ) as PrismaService;
    extended.onModuleInit = this.onModuleInit;
    extended.onModuleDestroy = this.onModuleDestroy;

    return extended;
  }

  async onModuleInit() {
    await this.$connect();
  }

  async onModuleDestroy() {
    await this.$disconnect();
  }
}
