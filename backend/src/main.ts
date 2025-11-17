import { NestFactory } from "@nestjs/core";
import { ConfigService } from "@nestjs/config";
import { AppModule } from "./app.module";
import { applyGlobalAppConfig } from "./app.bootstrap";

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  applyGlobalAppConfig(app);

  const configService = app.get(ConfigService);
  const port = configService.get<number>("PORT") ?? 3000;
  const host = configService.get<string>("HOST") ?? "0.0.0.0";
  await app.listen(port, host);
  console.log(`Application is running on: http://${host}:${port}`);
}

bootstrap();
