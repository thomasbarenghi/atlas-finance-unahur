import { registerUser } from "../utils/auth";
import { truncateAll } from "../utils/db";
import { getDashboard, seedBaseScenario } from "../utils/scenario";
import { createTestApp, TestContext } from "../utils/test-app";

/**
 * CAL-002 / CAL-003 — Flujo de fondos = Σ ingresos − Σ gastos; las
 * transferencias se excluyen.
 */
describe("CAL-002 · Flujo de fondos", () => {
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

  it("calcula ingresos − gastos del período", async () => {
    const user = await registerUser(ctx.app);
    await seedBaseScenario(ctx.app, user.accessToken);

    const dashboard = await getDashboard(ctx.app, user.accessToken);

    expect(dashboard.kpis.income).toBe(500);
    expect(dashboard.kpis.expenses).toBe(200);
    expect(dashboard.kpis.savings).toBe(300);
  });
});
