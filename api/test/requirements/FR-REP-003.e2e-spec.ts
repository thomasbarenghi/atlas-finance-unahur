import request from "supertest";
import { bearer, registerUser } from "../utils/auth";
import { truncateAll } from "../utils/db";
import { seedBaseScenario } from "../utils/scenario";
import { createTestApp, TestContext } from "../utils/test-app";

/**
 * FR-REP-003 — Mostrar evolución del patrimonio neto.
 */
describe("FR-REP-003 · Evolución del patrimonio", () => {
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

  it("devuelve la serie de patrimonio neto y coincide con el dashboard", async () => {
    const user = await registerUser(ctx.app);
    await seedBaseScenario(ctx.app, user.accessToken);

    const response = await request(ctx.server)
      .get("/api/reports/net-worth?from=2026-01-01&to=2026-03-31")
      .set(bearer(user.accessToken))
      .expect(200);

    expect(Array.isArray(response.body)).toBe(true);
    const march = response.body.find(
      (point: { date: string }) => point.date === "2026-03-31",
    );
    expect(march.netWorth).toBe(1300);
  });
});
