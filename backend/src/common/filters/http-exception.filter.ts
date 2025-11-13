import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
} from "@nestjs/common";
import { Response } from "express";

interface ErrorResponse {
  statusCode: number;
  error: string;
  message: string | string[];
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

    if (exception instanceof HttpException) {
      status = exception.getStatus();
      const res = exception.getResponse() as
        | string
        | {
            statusCode?: number;
            message?: string | string[];
            error?: string;
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
      }
    } else if (exception instanceof Error) {
      // Log the actual error for debugging
      console.error("[Exception]", exception);
    }

    response.status(status).json(errorResponse);
  }
}
