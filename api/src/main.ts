import { Logger, ValidationPipe } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { NestFactory } from "@nestjs/core";
import { DocumentBuilder, SwaggerModule } from "@nestjs/swagger";
import cookieParser from "cookie-parser";
import { AppModule } from "./app.module";
import { GlobalExceptionFilter } from "./common/filters/http-exception.filter";
import { LoggingInterceptor } from "./common/interceptors/logging.interceptor";
import { validationExceptionFactory } from "./common/pipes/validation-exception.factory";
import { AppConfig } from "./config/configuration";

const bootstrap = async (): Promise<void> => {
  const app = await NestFactory.create(AppModule);
  const config = app.get<ConfigService<AppConfig, true>>(ConfigService);
  const logger = new Logger("Bootstrap");

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
    origin: [cors.origin, ...cors.native],
    credentials: true,
  });

  const swaggerConfig = new DocumentBuilder()
    .setTitle("Atlass Fin API")
    .setDescription("Atlass Fin personal finance REST API")
    .setVersion("0.1.0")
    .addCookieAuth("access_token")
    .addBearerAuth()
    .build();
  const document = SwaggerModule.createDocument(app, swaggerConfig);
  SwaggerModule.setup("api/docs", app, document, {
    jsonDocumentUrl: "api/docs-json",
  });

  const port = config.get("port", { infer: true });
  await app.listen(port);
  logger.log(`API listening on http://localhost:${port}/api`);
};

void bootstrap();
