import { Logger } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { NestFactory } from "@nestjs/core";
import { AppModule } from "./app.module";
import { configureApp } from "./app.setup";
import { AppConfig } from "./config/configuration";

const bootstrap = async (): Promise<void> => {
  const app = await NestFactory.create(AppModule);
  const config = app.get<ConfigService<AppConfig, true>>(ConfigService);
  const logger = new Logger("Bootstrap");

  configureApp(app);

  const port = config.get("port", { infer: true });
  await app.listen(port);
  logger.log(`API listening on http://localhost:${port}/api`);
};

void bootstrap();
