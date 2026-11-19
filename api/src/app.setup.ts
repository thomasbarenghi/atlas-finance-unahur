import { HttpStatus, INestApplication, ValidationPipe } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { ValidationError } from "class-validator";
import cookieParser from "cookie-parser";
import { ApiException } from "./common/errors/api.exception";
import { ErrorCode } from "./common/errors/error-codes";
import { GlobalExceptionFilter } from "./common/filters/http-exception.filter";
import { AppConfig } from "./config/configuration";

/**
 * Describes a class-validator error tree as `{ field: [messages] }`, using
 * dotted paths for nested DTOs so the client can map errors to form fields.
 */
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
): ApiException =>
  new ApiException(
    ErrorCode.VALIDATION_ERROR,
    HttpStatus.BAD_REQUEST,
    "Validation failed",
    flattenValidationErrors(errors),
  );

/**
 * Applies the same cross-cutting configuration as `main.ts` (prefix, cookies,
 * validation pipe, exception filter and CORS). Extracted so the
 * HTTP e2e tests exercise the exact production behavior instead of a copy.
 */
export const configureApp = (app: INestApplication): void => {
  const config = app.get<ConfigService<AppConfig, true>>(ConfigService);

  app.setGlobalPrefix("api");
  app.use(cookieParser());
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      exceptionFactory: validationExceptionFactory,
    }),
  );
  app.useGlobalFilters(new GlobalExceptionFilter());

  const cors = config.get("cors", { infer: true });
  app.enableCors({
    origin: cors.origins,
    credentials: true,
  });
};
