import { NestFactory } from "@nestjs/core";
import { ValidationPipe } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import helmet from "helmet";
import { AppModule } from "./app.module";
import { HttpExceptionFilter } from "./common/filters/http-exception.filter";
import { LoggingInterceptor } from "./common/interceptors/logging.interceptor";

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // Security middleware
  app.use(helmet());

  // Global exception filter
  app.useGlobalFilters(new HttpExceptionFilter());

  // Global logging interceptor
  app.useGlobalInterceptors(new LoggingInterceptor());

  // Global validation pipe
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      transformOptions: {
        enableImplicitConversion: true,
      },
    }),
  );

  // Enable CORS with whitelist-based origin control
  const nodeEnv = process.env.NODE_ENV || "development";
  const corsAllowedOrigins = process.env.CORS_ALLOWED_ORIGINS || "";

  // Parse and validate allowed origins
  let allowedOrigins: string[] = [];

  if (corsAllowedOrigins.trim()) {
    // Explicitly configured origins
    allowedOrigins = corsAllowedOrigins
      .split(",")
      .map((origin) => origin.trim())
      .filter((origin) => origin.length > 0);
  } else if (nodeEnv === "production") {
    // Production: must have explicit configuration
    console.error(
      "[CORS] Production mode requires CORS_ALLOWED_ORIGINS to be set. Exiting.",
    );
    process.exit(1);
  } else {
    // Development: allow common localhost origins
    allowedOrigins = [
      "http://localhost:3000",
      "http://localhost:5173",
      "http://localhost:3001",
    ];
    console.log(
      `[CORS] Development mode: allowing default localhost origins:`,
      allowedOrigins,
    );
  }

  app.enableCors({
    origin: (origin, callback) => {
      // Allow requests without an Origin header (e.g., curl, Postman, mobile apps)
      if (!origin) {
        return callback(null, true);
      }

      if (allowedOrigins.includes(origin)) {
        return callback(null, true);
      }

      // Block non-whitelisted origins
      console.warn(`[CORS] Blocked origin: ${origin}`);
      return callback(new Error("Not allowed by CORS"), false);
    },
    credentials: true,
    methods: "GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS",
    allowedHeaders: "Content-Type,Authorization",
  });

  const configService = app.get(ConfigService);
  const port = configService.get<number>("PORT") ?? 3000;
  await app.listen(port);
  console.log(`Application is running on: http://localhost:${port}`);
}

bootstrap();
