import { Module } from "@nestjs/common";
import { JwtModule, JwtModuleOptions } from "@nestjs/jwt";
import { PassportModule } from "@nestjs/passport";
import { ConfigModule, ConfigService } from "@nestjs/config";
import { AuthService } from "./auth.service";
import { AuthController } from "./auth.controller";
import { UserModule } from "../user/user.module";
import { PrismaModule } from "../../prisma/prisma.module";
import { BcryptPasswordHasher } from "../../common/security/password-hasher";

@Module({
  imports: [
    UserModule,
    PassportModule,
    PrismaModule,
    ConfigModule,
    JwtModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: async (config: ConfigService): Promise<JwtModuleOptions> => {
        const expiresIn = config.get<string>("JWT_EXPIRES_IN") ?? "1h";
        return {
          secret: config.get<string>("JWT_SECRET") ?? "dev-secret",
          signOptions: {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            expiresIn: expiresIn as any,
          },
        };
      },
    }),
  ],
  providers: [AuthService, BcryptPasswordHasher],
  controllers: [AuthController],
  exports: [AuthService, JwtModule],
})
export class AuthModule {}
