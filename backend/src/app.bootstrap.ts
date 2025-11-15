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
  const nodeEnv = process.env.NODE_ENV || "development";
  const corsAllowedOrigins = process.env.CORS_ALLOWED_ORIGINS || "";

  let allowedOrigins: string[] = [];

  if (corsAllowedOrigins.trim()) {
    allowedOrigins = corsAllowedOrigins
      .split(",")
      .map((origin) => origin.trim())
      .filter((origin) => origin.length > 0);
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
    ];
    console.log(
      "[CORS] Non-production mode: allowing default localhost origins:",
      allowedOrigins,
    );
  }

  return {
    origin: (origin, callback) => {
      if (!origin) {
        return callback(null, true);
      }

      if (allowedOrigins.includes(origin)) {
        return callback(null, true);
      }

      console.warn(`[CORS] Blocked origin: ${origin}`);
      return callback(new Error("Not allowed by CORS"), false);
    },
    credentials: true,
    methods: "GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS",
    allowedHeaders: "Content-Type,Authorization",
  };
}
