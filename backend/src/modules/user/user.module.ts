import { Module } from "@nestjs/common";
import { UserService } from "./user.service";
import { PrismaModule } from "../../prisma/prisma.module";
import { BcryptPasswordHasher } from "../../common/security/password-hasher";

@Module({
  imports: [PrismaModule],
  providers: [UserService, BcryptPasswordHasher],
  exports: [UserService],
})
export class UserModule {}
