import { INestApplication } from "@nestjs/common";
import { Test, TestingModule } from "@nestjs/testing";
import { AppModule } from "../../src/app.module";
import {
  applyGlobalAppConfig,
  AppBootstrapOptions,
} from "../../src/app.bootstrap";
import { PrismaService } from "../../src/prisma/prisma.service";
import { resetDatabase as wipeDatabase } from "./test-database";

export interface TestingApp {
  app: INestApplication;
  module: TestingModule;
  httpServer: ReturnType<INestApplication["getHttpServer"]>;
  prisma: PrismaService;
  resetDatabase: () => Promise<void>;
  close: () => Promise<void>;
}

interface SeedContext {
  prisma: PrismaService;
}

export interface CreateTestingAppOptions extends AppBootstrapOptions {
  resetDbOnStart?: boolean;
  seed?: (ctx: SeedContext) => Promise<void>;
}

export async function createTestingApp(
  options: CreateTestingAppOptions = {},
): Promise<TestingApp> {
  if (!process.env.NODE_ENV) {
    process.env.NODE_ENV = "test";
  }

  const moduleFixture: TestingModule = await Test.createTestingModule({
    imports: [AppModule],
  }).compile();

  const app = moduleFixture.createNestApplication();
  applyGlobalAppConfig(app, options);
  await app.init();

  const prisma = app.get<PrismaService>(PrismaService);

  const resetDatabase = async () => {
    await wipeDatabase(prisma);
  };

  if (options.resetDbOnStart ?? true) {
    await resetDatabase();
  }

  if (options.seed) {
    await options.seed({ prisma });
  }

  const httpServer = app.getHttpServer();

  const close = async () => {
    await app.close();
  };

  return {
    app,
    module: moduleFixture,
    httpServer,
    prisma,
    resetDatabase,
    close,
  };
}
