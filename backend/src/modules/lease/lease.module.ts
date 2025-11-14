import { Module } from "@nestjs/common";
import { LeaseService } from "./lease.service";
import { LeaseController } from "./lease.controller";
import { PrismaModule } from "../../prisma/prisma.module";

@Module({
  imports: [PrismaModule],
  controllers: [LeaseController],
  providers: [LeaseService],
  exports: [LeaseService],
})
export class LeaseModule {}
