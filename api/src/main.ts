import { Logger } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { NestFactory } from "@nestjs/core";
import { DocumentBuilder, SwaggerModule } from "@nestjs/swagger";
import { apiReference } from "@scalar/nestjs-api-reference";
import { AppModule } from "./app.module";
import { configureApp } from "./app.setup";
import { AppConfig } from "./config/configuration";

const bootstrap = async (): Promise<void> => {
  const app = await NestFactory.create(AppModule);
  const config = app.get<ConfigService<AppConfig, true>>(ConfigService);
  const logger = new Logger("Bootstrap");

  configureApp(app);

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

  // Scalar renders the same OpenAPI document as an interactive reference.
  // The document is fetched from the JSON endpoint above, so `@nestjs/swagger`
  // stays the single source of truth for the contract.
  app.use(
    "/api/reference",
    apiReference({
      url: "/api/docs-json",
      pageTitle: "Atlass Fin API Reference",
    }),
  );

  const port = config.get("port", { infer: true });
  await app.listen(port);
  logger.log(`API listening on http://localhost:${port}/api`);
  logger.log(`API reference (Scalar): http://localhost:${port}/api/reference`);
  logger.log(`OpenAPI document: http://localhost:${port}/api/docs-json`);
};

void bootstrap();
