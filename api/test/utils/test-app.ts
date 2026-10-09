import { INestApplication } from "@nestjs/common";
import { Test, TestingModuleBuilder } from "@nestjs/testing";
import { DataSource } from "typeorm";
import { AppModule } from "../../src/app.module";
import { configureApp } from "../../src/app.setup";

export interface TestContext {
  app: INestApplication;
  dataSource: DataSource;
  /**
   * HTTP server bound to an ephemeral port once per suite. Handing a bound
   * `http.Server` to supertest makes every request reuse the same stable
   * listener; letting supertest create an ephemeral server per request (passing
   * the raw Express handler) produced intermittent
   * `Parse Error: Expected HTTP/` under rapid sequential requests.
   */
  server: any;
}

/**
 * Boots the full Nest application (same modules and global configuration as
 * production) against the test database and binds it to an ephemeral port.
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
  await app.listen(0);

  const dataSource = app.get(DataSource);
  return { app, dataSource, server: app.getHttpServer() };
};

/** Bound HTTP server of an app, for use with supertest. */
export const httpClient = (app: INestApplication): any => app.getHttpServer();
