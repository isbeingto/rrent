import { NestFactory } from "@nestjs/core";
import { ConfigService } from "@nestjs/config";
import { AppModule } from "./app.module";
import { applyGlobalAppConfig } from "./app.bootstrap";

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  applyGlobalAppConfig(app);

  const configService = app.get(ConfigService);
  const port = configService.get<number>("PORT") ?? 3000;
  await app.listen(port);
  console.log(`Application is running on: http://localhost:${port}`);
}

bootstrap();
