import { registerUser } from "../utils/auth";
import { truncateAll } from "../utils/db";
import { getDashboard, seedBaseScenario } from "../utils/scenario";
import { createTestApp, TestContext } from "../utils/test-app";

/**
 * CAL-001 — Patrimonio neto = Σ saldos netos de las cuentas del usuario.
 */
describe("CAL-001 · Patrimonio neto", () => {
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

  it("suma los saldos netos de las cuentas", async () => {
    const user = await registerUser(ctx.app);
    await seedBaseScenario(ctx.app, user.accessToken); // saldo neto 1300

    const dashboard = await getDashboard(ctx.app, user.accessToken);

    expect(dashboard.kpis.netWorth).toBe(1300);
  });

  it("es cero para un usuario sin cuentas", async () => {
    const user = await registerUser(ctx.app);

    const dashboard = await getDashboard(ctx.app, user.accessToken);
    expect(dashboard.kpis.netWorth).toBe(0);
  });
});
