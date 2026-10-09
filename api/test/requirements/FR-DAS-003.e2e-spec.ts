import { registerUser } from "../utils/auth";
import { truncateAll } from "../utils/db";
import { getDashboard, seedBaseScenario } from "../utils/scenario";
import { createTestApp, TestContext } from "../utils/test-app";

/**
 * FR-DAS-003 — Comparar ingresos y gastos por mes.
 */
describe("FR-DAS-003 · Ingresos vs. gastos por mes", () => {
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

  it("devuelve ingresos y gastos por mes del período", async () => {
    const user = await registerUser(ctx.app);
    await seedBaseScenario(ctx.app, user.accessToken);

    const dashboard = await getDashboard(ctx.app, user.accessToken);
    const byMonth = new Map(
      dashboard.incomeExpenseByMonth.map(
        (m: { month: string; income: number; expenses: number }) => [
          m.month,
          m,
        ],
      ),
    );

    expect([...byMonth.keys()]).toEqual(["2026-01", "2026-02", "2026-03"]);
    expect(byMonth.get("2026-03")).toMatchObject({
      income: 500,
      expenses: 200,
    });
    expect(byMonth.get("2026-01")).toMatchObject({ income: 0, expenses: 0 });
  });
});
