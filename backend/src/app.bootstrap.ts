import { INestApplication, ValidationPipe } from "@nestjs/common";
import { CorsOptions } from "@nestjs/common/interfaces/external/cors-options.interface";
import helmet from "helmet";
import { HttpExceptionFilter } from "./common/filters/http-exception.filter";
import { LoggingInterceptor } from "./common/interceptors/logging.interceptor";

export interface AppBootstrapOptions {
  enableCors?: boolean;
  useGlobalFilters?: boolean;
  useGlobalPipes?: boolean;
  useGlobalInterceptors?: boolean;
  useHelmet?: boolean;
}

export function applyGlobalAppConfig(
  app: INestApplication,
  options: AppBootstrapOptions = {},
): void {
  const {
    enableCors = true,
    useGlobalFilters = true,
    useGlobalPipes = true,
    useGlobalInterceptors = true,
    useHelmet = true,
  } = options;

  if (useHelmet) {
    app.use(helmet());
  }

  if (useGlobalFilters) {
    app.useGlobalFilters(new HttpExceptionFilter());
  }

  if (useGlobalInterceptors) {
    app.useGlobalInterceptors(new LoggingInterceptor());
  }

  if (useGlobalPipes) {
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
  }

  if (enableCors) {
    app.enableCors(createCorsOptions());
  }
}

function createCorsOptions(): CorsOptions {
  console.log("[CORS] ===== Creating CORS Options =====");
  const nodeEnv = process.env.NODE_ENV || "development";
  const corsAllowedOrigins = process.env.CORS_ALLOWED_ORIGINS || "";
  console.log(`[CORS] NODE_ENV: ${nodeEnv}`);
  console.log(`[CORS] CORS_ALLOWED_ORIGINS: ${corsAllowedOrigins}`);

  let allowedOrigins: string[] = [];

  if (corsAllowedOrigins.trim()) {
    allowedOrigins = corsAllowedOrigins
      .split(",")
      .map((origin) => origin.trim())
      .filter((origin) => origin.length > 0);
    console.log("[CORS] Using env CORS_ALLOWED_ORIGINS:", allowedOrigins);
  } else if (nodeEnv === "production") {
    console.error(
      "[CORS] Production mode requires CORS_ALLOWED_ORIGINS to be set. Exiting.",
    );
    process.exit(1);
  } else {
    allowedOrigins = [
      "http://localhost:3000",
      "http://localhost:5173",
      "http://localhost:3001",
      "http://74.122.24.3:5173",
      "http://74.122.24.3:3000",
    ];
    console.log(
      "[CORS] Non-production mode: allowing default localhost origins:",
      allowedOrigins,
    );
  }

  return {
    origin: (origin, callback) => {
      console.log(`[CORS] Checking origin: ${origin}`);
      if (!origin) {
        console.log("[CORS] No origin header, allowing request");
        return callback(null, true);
      }

      if (allowedOrigins.includes(origin)) {
        console.log(`[CORS] Origin ${origin} is allowed`);
        return callback(null, true);
      }

      console.warn(`[CORS] Blocked origin: ${origin}`);
      console.warn(`[CORS] Allowed origins:`, JSON.stringify(allowedOrigins));
      console.warn(`[CORS] Origin type: ${typeof origin}, length: ${origin.length}`);
      return callback(new Error("Not allowed by CORS"), false);
    },
    credentials: true,
    methods: "GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS",
    allowedHeaders: "Content-Type,Authorization,X-Organization-Id",
  };
}
