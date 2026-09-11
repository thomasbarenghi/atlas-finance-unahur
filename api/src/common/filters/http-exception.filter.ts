import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
  Logger,
} from "@nestjs/common";
import { Response } from "express";
import { ErrorCode } from "../errors/error-codes";

const SERVER_ERROR_STATUS = 500;

interface NormalizedError {
  statusCode: number;
  code: string;
  message: string;
  fieldErrors?: Record<string, string[]>;
}

const STATUS_FALLBACK: Record<number, ErrorCode> = {
  [HttpStatus.BAD_REQUEST]: ErrorCode.VALIDATION_ERROR,
  [HttpStatus.UNAUTHORIZED]: ErrorCode.UNAUTHENTICATED,
  [HttpStatus.FORBIDDEN]: ErrorCode.FORBIDDEN,
  [HttpStatus.NOT_FOUND]: ErrorCode.NOT_FOUND,
  [HttpStatus.TOO_MANY_REQUESTS]: ErrorCode.RATE_LIMITED,
  [HttpStatus.BAD_GATEWAY]: ErrorCode.INTERNAL_ERROR,
  [HttpStatus.INTERNAL_SERVER_ERROR]: ErrorCode.INTERNAL_ERROR,
};

@Catch()
export class GlobalExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger("ExceptionFilter");

  catch(exception: unknown, host: ArgumentsHost): void {
    const response = host.switchToHttp().getResponse<Response>();
    const normalized = this.normalize(exception);

    if (normalized.statusCode >= SERVER_ERROR_STATUS) {
      const stack = exception instanceof Error ? exception.stack : undefined;
      this.logger.error(normalized.message, stack);
    }

    response.status(normalized.statusCode).json(normalized);
  }

  private normalize(exception: unknown): NormalizedError {
    if (!(exception instanceof HttpException)) {
      return {
        statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
        code: ErrorCode.INTERNAL_ERROR,
        message: "Internal server error",
      };
    }

    const statusCode = exception.getStatus();
    const payload = exception.getResponse();
    const code =
      this.extractCode(payload) ??
      STATUS_FALLBACK[statusCode] ??
      ErrorCode.INTERNAL_ERROR;

    if (statusCode >= SERVER_ERROR_STATUS) {
      return {
        statusCode,
        code,
        message: "Internal server error",
      };
    }

    return {
      statusCode,
      code,
      message: this.extractMessage(payload, exception.message),
      ...(this.extractFieldErrors(payload)
        ? { fieldErrors: this.extractFieldErrors(payload) }
        : {}),
    };
  }

  private extractCode(payload: string | object): string | undefined {
    if (typeof payload === "object" && payload !== null && "code" in payload) {
      const code = (payload as { code?: unknown }).code;
      return typeof code === "string" ? code : undefined;
    }
    return undefined;
  }

  private extractMessage(payload: string | object, fallback: string): string {
    if (typeof payload === "string") return payload;
    if (payload !== null && "message" in payload) {
      const message = (payload as { message?: unknown }).message;
      if (Array.isArray(message)) return message.join(", ");
      if (typeof message === "string") return message;
    }
    return fallback;
  }

  private extractFieldErrors(
    payload: string | object,
  ): Record<string, string[]> | undefined {
    if (
      typeof payload === "object" &&
      payload !== null &&
      "fieldErrors" in payload
    ) {
      const fieldErrors = (payload as { fieldErrors?: unknown }).fieldErrors;
      if (fieldErrors && typeof fieldErrors === "object") {
        return fieldErrors as Record<string, string[]>;
      }
    }
    return undefined;
  }
}
