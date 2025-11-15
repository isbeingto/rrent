import { ArgumentsHost, HttpException, HttpStatus } from "@nestjs/common";
import { HttpExceptionFilter } from "../src/common/filters/http-exception.filter";
import { AppException } from "../src/common/errors/app-exception.base";
import { AppErrorCode } from "../src/common/errors/app-error-code.enum";

describe("HttpExceptionFilter", () => {
  let filter: HttpExceptionFilter;
  let mockResponse: { status: jest.Mock; json: jest.Mock };
  let mockHost: ArgumentsHost;

  beforeEach(() => {
    filter = new HttpExceptionFilter();
    mockResponse = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    };

    mockHost = {
      switchToHttp: jest.fn().mockReturnValue({
        getResponse: () => mockResponse,
      }),
    } as unknown as ArgumentsHost;
  });

  describe("AppException", () => {
    it("should handle AppException with code", () => {
      const appException = new AppException(
        AppErrorCode.TENANT_NOT_FOUND,
        "Tenant not found",
        HttpStatus.NOT_FOUND,
      );

      filter.catch(appException, mockHost);

      expect(mockResponse.status).toHaveBeenCalledWith(HttpStatus.NOT_FOUND);
      expect(mockResponse.json).toHaveBeenCalledWith({
        statusCode: HttpStatus.NOT_FOUND,
        error: "AppException",
        message: "Tenant not found",
        code: AppErrorCode.TENANT_NOT_FOUND,
      });
    });

    it("should merge additional fields from AppException response", () => {
      class CustomAppException extends AppException {
        constructor() {
          super(
            AppErrorCode.VALIDATION_FAILED,
            "Custom error",
            HttpStatus.BAD_REQUEST,
          );
        }
        getResponse() {
          return {
            statusCode: this.getStatus(),
            message: this.message,
            code: this.code,
            extraField: "extraValue",
          };
        }
      }

      const exception = new CustomAppException();
      filter.catch(exception, mockHost);

      expect(mockResponse.json).toHaveBeenCalledWith(
        expect.objectContaining({
          extraField: "extraValue",
        }),
      );
    });
  });

  describe("HttpException", () => {
    it("should handle HttpException with string response", () => {
      const httpException = new HttpException(
        "Not found",
        HttpStatus.NOT_FOUND,
      );

      filter.catch(httpException, mockHost);

      expect(mockResponse.status).toHaveBeenCalledWith(HttpStatus.NOT_FOUND);
      expect(mockResponse.json).toHaveBeenCalledWith({
        statusCode: HttpStatus.NOT_FOUND,
        error: "NOT_FOUND",
        message: "Not found",
      });
    });

    it("should handle HttpException with object response", () => {
      const httpException = new HttpException(
        {
          statusCode: HttpStatus.BAD_REQUEST,
          message: "Validation failed",
          error: "Bad Request",
        },
        HttpStatus.BAD_REQUEST,
      );

      filter.catch(httpException, mockHost);

      expect(mockResponse.status).toHaveBeenCalledWith(HttpStatus.BAD_REQUEST);
      expect(mockResponse.json).toHaveBeenCalledWith({
        statusCode: HttpStatus.BAD_REQUEST,
        error: "Bad Request",
        message: "Validation failed",
      });
    });

    it("should preserve code from HttpException response", () => {
      const httpException = new HttpException(
        {
          statusCode: HttpStatus.FORBIDDEN,
          message: "Forbidden",
          error: "Forbidden",
          code: "CUSTOM_CODE",
        },
        HttpStatus.FORBIDDEN,
      );

      filter.catch(httpException, mockHost);

      expect(mockResponse.json).toHaveBeenCalledWith(
        expect.objectContaining({
          code: "CUSTOM_CODE",
        }),
      );
    });

    it("should handle ThrottlerException with specific code", () => {
      const throttlerException = new HttpException(
        "ThrottlerException: Too Many Requests",
        HttpStatus.TOO_MANY_REQUESTS,
      );

      filter.catch(throttlerException, mockHost);

      expect(mockResponse.status).toHaveBeenCalledWith(
        HttpStatus.TOO_MANY_REQUESTS,
      );
      expect(mockResponse.json).toHaveBeenCalledWith({
        statusCode: HttpStatus.TOO_MANY_REQUESTS,
        error: "TOO_MANY_REQUESTS",
        message: "Too many attempts, please try again later.",
        code: AppErrorCode.AUTH_RATE_LIMITED,
      });
    });

    it("should use default error name when HttpStatus not found", () => {
      const httpException = new HttpException(
        "Unknown error",
        599 as HttpStatus,
      );

      filter.catch(httpException, mockHost);

      expect(mockResponse.json).toHaveBeenCalledWith(
        expect.objectContaining({
          error: "Error",
        }),
      );
    });

    it("should handle HttpException with empty message in response", () => {
      const httpException = new HttpException(
        {
          statusCode: HttpStatus.BAD_REQUEST,
        },
        HttpStatus.BAD_REQUEST,
      );

      filter.catch(httpException, mockHost);

      expect(mockResponse.json).toHaveBeenCalledWith(
        expect.objectContaining({
          message: "",
        }),
      );
    });
  });

  describe("Generic Error", () => {
    it("should handle generic Error instance", () => {
      const consoleErrorSpy = jest.spyOn(console, "error").mockImplementation();
      const genericError = new Error("Something went wrong");

      filter.catch(genericError, mockHost);

      expect(consoleErrorSpy).toHaveBeenCalledWith("[Exception]", genericError);
      expect(mockResponse.status).toHaveBeenCalledWith(
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
      expect(mockResponse.json).toHaveBeenCalledWith({
        statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
        error: "Internal Server Error",
        message: "Something went wrong",
      });

      consoleErrorSpy.mockRestore();
    });

    it("should handle Error without message", () => {
      const consoleErrorSpy = jest.spyOn(console, "error").mockImplementation();
      const error = new Error();
      error.message = "";

      filter.catch(error, mockHost);

      expect(mockResponse.json).toHaveBeenCalledWith(
        expect.objectContaining({
          message: "Unexpected error",
        }),
      );

      consoleErrorSpy.mockRestore();
    });
  });

  describe("Unknown Exception", () => {
    it("should handle completely unknown exception type", () => {
      const unknownException = { some: "object" };

      filter.catch(unknownException, mockHost);

      expect(mockResponse.status).toHaveBeenCalledWith(
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
      expect(mockResponse.json).toHaveBeenCalledWith({
        statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
        error: "Internal Server Error",
        message: "Unexpected error",
      });
    });

    it("should handle null exception", () => {
      filter.catch(null, mockHost);

      expect(mockResponse.status).toHaveBeenCalledWith(
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
      expect(mockResponse.json).toHaveBeenCalledWith({
        statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
        error: "Internal Server Error",
        message: "Unexpected error",
      });
    });

    it("should handle undefined exception", () => {
      filter.catch(undefined, mockHost);

      expect(mockResponse.status).toHaveBeenCalledWith(
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
      expect(mockResponse.json).toHaveBeenCalledWith({
        statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
        error: "Internal Server Error",
        message: "Unexpected error",
      });
    });
  });
});
