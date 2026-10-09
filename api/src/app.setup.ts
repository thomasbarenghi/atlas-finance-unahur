import { INestApplication, ValidationPipe } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import cookieParser from "cookie-parser";
import { GlobalExceptionFilter } from "./common/filters/http-exception.filter";
import { LoggingInterceptor } from "./common/interceptors/logging.interceptor";
import { validationExceptionFactory } from "./common/pipes/validation-exception.factory";
import { AppConfig } from "./config/configuration";

/**
 * Applies the same cross-cutting configuration as `main.ts` (prefix, cookies,
 * validation pipe, exception filter, interceptor and CORS). Extracted so the
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
  app.useGlobalInterceptors(new LoggingInterceptor());

  const cors = config.get("cors", { infer: true });
  app.enableCors({
    origin: [...cors.origins, ...cors.native],
    credentials: true,
  });
};
