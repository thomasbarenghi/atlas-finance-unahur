import { registerUser } from "../utils/auth";
import { truncateAll } from "../utils/db";
import { getDashboard, seedBaseScenario } from "../utils/scenario";
import { createTestApp, TestContext } from "../utils/test-app";

/**
 * FR-DAS-002 — Mostrar la evolución temporal del patrimonio neto.
 */
describe("FR-DAS-002 · Evolución del patrimonio", () => {
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

  it("devuelve una serie mensual con activos y deudas", async () => {
    const user = await registerUser(ctx.app);
    await seedBaseScenario(ctx.app, user.accessToken);

    const dashboard = await getDashboard(ctx.app, user.accessToken);

    expect(Array.isArray(dashboard.netWorthSeries)).toBe(true);
    expect(dashboard.netWorthSeries.length).toBe(3); // ene, feb, mar
    for (const point of dashboard.netWorthSeries) {
      expect(point).toEqual(
        expect.objectContaining({
          date: expect.any(String),
          value: expect.any(Number),
          assets: expect.any(Number),
          debts: expect.any(Number),
        }),
      );
    }
    const march = dashboard.netWorthSeries.find(
      (p: { date: string }) => p.date === "2026-03-31",
    );
    expect(march.value).toBe(1300);
  });
});
