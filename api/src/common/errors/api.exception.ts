import { HttpException, HttpStatus } from "@nestjs/common";
import { ErrorCode } from "./error-codes";

export interface ApiErrorBody {
  statusCode: number;
  code: ErrorCode;
  message: string;
  fieldErrors?: Record<string, string[]>;
}

export class ApiException extends HttpException {
  constructor(
    code: ErrorCode,
    status: HttpStatus,
    message: string,
    fieldErrors?: Record<string, string[]>,
  ) {
    const body: ApiErrorBody = { statusCode: status, code, message };
    if (fieldErrors) {
      body.fieldErrors = fieldErrors;
    }
    super(body, status);
  }
}
