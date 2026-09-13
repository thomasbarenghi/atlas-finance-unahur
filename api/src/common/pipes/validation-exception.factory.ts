import { BadRequestException, HttpStatus } from "@nestjs/common";
import { ValidationError } from "class-validator";
import { ErrorCode } from "../errors/error-codes";

export const flattenValidationErrors = (
  errors: ValidationError[],
  parent = "",
): Record<string, string[]> => {
  const result: Record<string, string[]> = {};
  for (const error of errors) {
    const path = parent ? `${parent}.${error.property}` : error.property;
    if (error.constraints) {
      result[path] = Object.values(error.constraints);
    }
    if (error.children && error.children.length > 0) {
      Object.assign(result, flattenValidationErrors(error.children, path));
    }
  }
  return result;
};

export const validationExceptionFactory = (
  errors: ValidationError[],
): BadRequestException =>
  new BadRequestException({
    statusCode: HttpStatus.BAD_REQUEST,
    code: ErrorCode.VALIDATION_ERROR,
    message: "Validation failed",
    fieldErrors: flattenValidationErrors(errors),
  });
