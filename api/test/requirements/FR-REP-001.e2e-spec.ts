import request from "supertest";
import { bearer, registerUser } from "../utils/auth";
import { truncateAll } from "../utils/db";
import { seedBaseScenario } from "../utils/scenario";
import { createTestApp, TestContext } from "../utils/test-app";

/**
 * FR-REP-001 — Generar un resumen financiero para un período seleccionado.
 */
describe("FR-REP-001 · Resumen financiero", () => {
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

  it("devuelve ingresos, gastos, ahorro y patrimonio del período", async () => {
    const user = await registerUser(ctx.app);
    await seedBaseScenario(ctx.app, user.accessToken);

    const response = await request(ctx.server)
      .get("/api/reports/summary?from=2026-01-01&to=2026-03-31")
      .set(bearer(user.accessToken))
      .expect(200);

    expect(response.body).toEqual({
      from: "2026-01-01",
      to: "2026-03-31",
      currency: "ARS",
      income: 500,
      expenses: 200,
      savings: 300,
      netWorth: 1300,
    });
  });

  it("exige sesión", async () => {
    await request(ctx.server).get("/api/reports/summary").expect(401);
  });
});
