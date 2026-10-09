import request from "supertest";
import {
  DEMO_EMAIL,
  DEMO_PASSWORD,
  EMPTY_EMAIL,
} from "../../src/database/seeds/seed";
import { bearer, loginUser, registerUser } from "../utils/auth";
import { truncateAll } from "../utils/db";
import { createTestApp, TestContext } from "../utils/test-app";

/**
 * DEV-DB — Endpoints de mantenimiento de base de datos (solo desarrollo/test):
 * vaciar, sembrar y resetear. Verifican que el flujo `reset -> seed` deja un
 * estado conocido y reproducible.
 */
describe("DEV-DB · Mantenimiento de base de datos", () => {
  let ctx: TestContext;

  beforeAll(async () => {
    ctx = await createTestApp();
  });

  beforeEach(async () => {
    await truncateAll(ctx.dataSource);
  });

  afterAll(async () => {
    await ctx.app.close();
  });

  it("siembra un dataset determinístico y permite iniciar sesión con él", async () => {
    const response = await request(ctx.server)
      .post("/api/dev/database/seed")
      .expect(200);
    expect(response.body).toMatchObject({ action: "seed", seeded: true });

    const demo = await loginUser(ctx.app, DEMO_EMAIL, DEMO_PASSWORD);
    const accounts = await request(ctx.server)
      .get("/api/accounts")
      .set(bearer(demo.accessToken))
      .expect(200);
    expect(accounts.body.length).toBeGreaterThan(0);

    // El usuario vacío existe pero no tiene datos (estados vacíos).
    const empty = await loginUser(ctx.app, EMPTY_EMAIL, DEMO_PASSWORD);
    const emptyAccounts = await request(ctx.server)
      .get("/api/accounts")
      .set(bearer(empty.accessToken))
      .expect(200);
    expect(emptyAccounts.body).toEqual([]);
  });

  it("vacía todas las tablas de la aplicación", async () => {
    await request(ctx.server).post("/api/dev/database/seed").expect(200);

    const response = await request(ctx.server)
      .post("/api/dev/database/clear")
      .expect(200);
    expect(response.body).toMatchObject({ action: "clear", seeded: false });

    await request(ctx.server)
      .post("/api/auth/login")
      .send({ email: DEMO_EMAIL, password: DEMO_PASSWORD })
      .expect(401);
  });

  it("reset descarta los datos previos y vuelve a sembrar", async () => {
    const extra = await registerUser(ctx.app);

    const response = await request(ctx.server)
      .post("/api/dev/database/reset")
      .expect(200);
    expect(response.body).toMatchObject({ action: "reset", seeded: true });
    expect(response.body.tables).toBeGreaterThan(0);

    // El usuario creado antes del reset ya no existe.
    await request(ctx.server)
      .post("/api/auth/login")
      .send({ email: extra.email, password: extra.password })
      .expect(401);

    // El dataset demo está disponible otra vez.
    await loginUser(ctx.app, DEMO_EMAIL, DEMO_PASSWORD);
  });
});
