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

  it("devuelve una serie mensual del patrimonio neto", async () => {
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
        }),
      );
    }
    const march = dashboard.netWorthSeries.find(
      (p: { date: string }) => p.date === "2026-03-31",
    );
    expect(march.value).toBe(1300);
  });

  it("usa evolución diaria y tramos semanales para un mes en curso", async () => {
    const user = await registerUser(ctx.app);
    await seedBaseScenario(ctx.app, user.accessToken);

    const dashboard = await getDashboard(
      ctx.app,
      user.accessToken,
      "from=2026-03-01&to=2026-03-25",
    );

    expect(dashboard.netWorthSeries).toHaveLength(25);
    expect(dashboard.netWorthSeries.at(-1)?.date).toBe("2026-03-25");
    expect(dashboard.incomeExpenseByPeriod).toHaveLength(4);
    expect(dashboard.incomeExpenseByPeriod[0]).toMatchObject({
      bucket: "week",
      start: "2026-03-01",
      end: "2026-03-07",
      income: 500,
    });
    expect(dashboard.incomeExpenseByMonth).toHaveLength(1);
  });
});
