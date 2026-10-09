import { registerUser } from "../utils/auth";
import { truncateAll } from "../utils/db";
import { createAsset, createDebt } from "../utils/factories";
import { getDashboard, seedBaseScenario } from "../utils/scenario";
import { createTestApp, TestContext } from "../utils/test-app";

/**
 * CAL-001 — Patrimonio neto = Σ activos + Σ posiciones + Σ saldos netos de
 * cuentas − Σ deudas. Los objetivos no se suman.
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

  it("resta deudas y suma activos al saldo de cuentas", async () => {
    const user = await registerUser(ctx.app);
    await seedBaseScenario(ctx.app, user.accessToken); // cuentas netas 1300
    await createAsset(ctx.app, user.accessToken, {
      name: "Depto",
      type: "property",
      currency: "ARS",
      initialValue: 5000,
      date: "2026-03-01",
    });
    await createDebt(ctx.app, user.accessToken, {
      name: "Hipoteca",
      type: "mortgage",
      balance: 2000,
      currency: "ARS",
      date: "2026-03-01",
    });

    const dashboard = await getDashboard(ctx.app, user.accessToken);

    expect(dashboard.kpis.assets).toBe(5000);
    expect(dashboard.kpis.debts).toBe(2000);
    expect(dashboard.kpis.accounts).toBe(1300);
    expect(dashboard.kpis.netWorth).toBe(4300);
  });
});
