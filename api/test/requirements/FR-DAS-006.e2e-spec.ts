import { registerUser } from "../utils/auth";
import { truncateAll } from "../utils/db";
import { createBudget, createCategory } from "../utils/factories";
import { getDashboard, seedBaseScenario } from "../utils/scenario";
import { createTestApp, TestContext } from "../utils/test-app";

/**
 * FR-DAS-006 — Mostrar presupuestos cercanos al límite o excedidos.
 */
describe("FR-DAS-006 · Alertas de presupuesto", () => {
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

  it("incluye solo los presupuestos en advertencia o excedidos", async () => {
    const user = await registerUser(ctx.app);
    const { expenseCategory } = await seedBaseScenario(
      ctx.app,
      user.accessToken,
    );
    // Gasto de 200 sobre límite 250 => 80% (advertencia).
    await createBudget(ctx.app, user.accessToken, {
      categoryId: expenseCategory.id,
      period: "2026-03",
      limit: 250,
      currency: "ARS",
    });
    // Presupuesto sin consumo => no alerta.
    const other = await createCategory(ctx.app, user.accessToken, {
      name: "Ocio",
    });
    await createBudget(ctx.app, user.accessToken, {
      categoryId: other.id,
      period: "2026-03",
      limit: 10000,
      currency: "ARS",
    });

    const dashboard = await getDashboard(ctx.app, user.accessToken);

    expect(dashboard.budgetAlerts).toHaveLength(1);
    expect(dashboard.budgetAlerts[0]).toMatchObject({
      categoryName: "Comida",
      status: "warning",
    });
  });
});
