import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
} from "@nestjs/common";
import { Response } from "express";

@Catch()
export class GlobalExceptionFilter implements ExceptionFilter {
  catch(exception: unknown, host: ArgumentsHost): void {
    const response = host.switchToHttp().getResponse<Response>();
    const isHttp = exception instanceof HttpException;
    const statusCode = isHttp ? exception.getStatus() : 500;

    if (statusCode >= 500) {
      response.status(statusCode).json({
        statusCode,
        message: "Internal server error",
      });
      return;
    }

    const payload = isHttp ? exception.getResponse() : undefined;
    if (typeof payload === "object" && payload !== null) {
      response.status(statusCode).json(payload);
      return;
    }

    response.status(statusCode).json({
      statusCode,
      message:
        exception instanceof Error
          ? exception.message
          : "Internal server error",
    });
  }
}
