import { INestApplication } from "@nestjs/common";
import { Test, TestingModuleBuilder } from "@nestjs/testing";
import { DataSource } from "typeorm";
import { AppModule } from "../../src/app.module";
import { configureApp } from "../../src/app.setup";

export interface TestContext {
  app: INestApplication;
  dataSource: DataSource;
  /**
   * Express request handler. Handing this (instead of the raw `http.Server`) to
   * supertest makes it spin up an ephemeral server per request, avoiding
   * cross-app socket/port reuse between test files.
   */
  server: any;
}

/**
 * Boots the full Nest application (same modules and global configuration as
 * production) against the test database.
 */
export const createTestApp = async (
  configure?: (builder: TestingModuleBuilder) => TestingModuleBuilder,
): Promise<TestContext> => {
  let builder = Test.createTestingModule({ imports: [AppModule] });
  if (configure) builder = configure(builder);

  const moduleRef = await builder.compile();

  const app = moduleRef.createNestApplication();
  configureApp(app);
  await app.init();

  const dataSource = app.get(DataSource);
  return { app, dataSource, server: app.getHttpAdapter().getInstance() };
};

/** Express instance of an app, for use with supertest. */
export const httpClient = (app: INestApplication): any =>
  app.getHttpAdapter().getInstance();
