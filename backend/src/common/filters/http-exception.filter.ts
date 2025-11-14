import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
} from "@nestjs/common";
import { Response } from "express";
import { AppException } from "../errors/app-exception.base";
import { AppErrorCode } from "../errors/app-error-code.enum";

interface ErrorResponse {
  statusCode: number;
  error: string;
  message: string | string[];
  code?: string;
}

@Catch()
export class HttpExceptionFilter implements ExceptionFilter {
  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();

    let status = HttpStatus.INTERNAL_SERVER_ERROR;
    let errorResponse: ErrorResponse = {
      statusCode: status,
      error: "Internal Server Error",
      message: "Unexpected error",
    };

    // 优先处理 AppException（带 code）
    if (exception instanceof AppException) {
      status = exception.getStatus();
      const res = exception.getResponse() as Record<string, unknown>;

      errorResponse = {
        statusCode: status,
        error: exception.constructor.name,
        message: exception.message,
        code: exception.code,
      };

      // 如果 getResponse 返回了额外字段，合并它们
      if (typeof res === "object" && res !== null) {
        Object.assign(errorResponse, res);
      }
    } else if (exception instanceof HttpException) {
      status = exception.getStatus();
      const res = exception.getResponse() as
        | string
        | {
            statusCode?: number;
            message?: string | string[];
            error?: string;
            code?: string;
          };

      if (typeof res === "string") {
        errorResponse = {
          statusCode: status,
          error: HttpStatus[status] ?? "Error",
          message: res,
        };
      } else {
        errorResponse = {
          statusCode: res.statusCode ?? status,
          error: res.error ?? (HttpStatus[status] as string) ?? "Error",
          message: res.message ?? "",
        };
        // 如果原始异常中有 code，保留它
        if (res.code) {
          errorResponse.code = res.code;
        }
      }

      // Handle ThrottlerException (429 - Too Many Requests)
      if (status === HttpStatus.TOO_MANY_REQUESTS) {
        errorResponse.code = AppErrorCode.AUTH_RATE_LIMITED;
        errorResponse.message = "Too many attempts, please try again later.";
      }
    } else if (exception instanceof Error) {
      // Log the actual error for debugging
      console.error("[Exception]", exception);
      errorResponse = {
        statusCode: status,
        error: "Internal Server Error",
        message: exception.message || "Unexpected error",
      };
    }

    response.status(status).json(errorResponse);
  }
}
