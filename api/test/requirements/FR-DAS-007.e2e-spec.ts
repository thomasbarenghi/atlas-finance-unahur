import request from "supertest";
import { bearer, registerUser } from "../utils/auth";
import { truncateAll } from "../utils/db";
import { seedBaseScenario } from "../utils/scenario";
import { createTestApp, TestContext } from "../utils/test-app";

/**
 * FR-DAS-007 — Permitir cambiar el período de visualización del dashboard.
 */
describe("FR-DAS-007 · Período de visualización", () => {
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
      .set(bearer(user.accessToken))
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
      .set(bearer(user.accessToken))
      .expect(200);

    expect(response.body.period.from < response.body.period.to).toBe(true);
  });
});
