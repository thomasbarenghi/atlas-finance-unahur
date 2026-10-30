import request from "supertest";
import { authCookie, registerUser } from "../utils/auth";
import { truncateAll } from "../utils/db";
import { seedBaseScenario } from "../utils/scenario";
import { createTestApp, TestContext } from "../utils/test-app";

/**
 * FR-DAS-003 — Permitir cambiar el período de visualización del dashboard.
 */
describe("FR-DAS-003 · Período de visualización", () => {
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

  it("respeta el rango enviado en el query", async () => {
    const user = await registerUser(ctx.app);
    await seedBaseScenario(ctx.app, user.accessToken);

    const response = await request(ctx.server)
      .get("/api/dashboard?from=2026-03-01&to=2026-03-31")
      .set(authCookie(user.accessToken))
      .expect(200);

    expect(response.body.period).toEqual({
      from: "2026-03-01",
      to: "2026-03-31",
    });
    expect(response.body.kpis.income).toBe(500);
    expect(response.body.kpis.expenses).toBe(200);
    expect(response.body.currency).toBe("ARS");
  });

  it("usa un período por defecto cuando no se envía rango", async () => {
    const user = await registerUser(ctx.app);
    await seedBaseScenario(ctx.app, user.accessToken);

    const response = await request(ctx.server)
      .get("/api/dashboard")
      .set(authCookie(user.accessToken))
      .expect(200);

    expect(response.body.period.from < response.body.period.to).toBe(true);
  });

  it("rechaza un rango invertido", async () => {
    const user = await registerUser(ctx.app);

    const response = await request(ctx.server)
      .get("/api/dashboard?from=2026-04-01&to=2026-03-01")
      .set(authCookie(user.accessToken))
      .expect(400);

    expect(response.body.code).toBe("VALIDATION_ERROR");
  });

  it("rechaza un rango mayor a 366 días", async () => {
    const user = await registerUser(ctx.app);

    const response = await request(ctx.server)
      .get("/api/dashboard?from=2025-01-01&to=2026-03-31")
      .set(authCookie(user.accessToken))
      .expect(400);

    expect(response.body.code).toBe("VALIDATION_ERROR");
  });
});
