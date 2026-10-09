import { registerUser } from "../utils/auth";
import { truncateAll } from "../utils/db";
import { createAsset } from "../utils/factories";
import { getDashboard, seedBaseScenario } from "../utils/scenario";
import { createTestApp, TestContext } from "../utils/test-app";

/**
 * FR-DAS-005 — Mostrar la composición de activos por tipo.
 */
describe("FR-DAS-005 · Composición de activos", () => {
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

  it("compone el patrimonio con activos físicos, cuentas y deudas", async () => {
    const user = await registerUser(ctx.app);
    await seedBaseScenario(ctx.app, user.accessToken);
    await createAsset(ctx.app, user.accessToken, {
      name: "Depto",
      type: "property",
      currency: "ARS",
      initialValue: 90000,
      date: "2026-03-01",
    });

    const dashboard = await getDashboard(ctx.app, user.accessToken);

    expect(dashboard.kpis.assets).toBe(90000);
    expect(dashboard.kpis.netWorth).toBe(91300);
    expect(dashboard.assetsComposition).toEqual(
      expect.arrayContaining([{ type: "property", value: 90000 }]),
    );
    expect(dashboard.netWorthComposition).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ kind: "property", value: 90000 }),
      ]),
    );
  });
});
