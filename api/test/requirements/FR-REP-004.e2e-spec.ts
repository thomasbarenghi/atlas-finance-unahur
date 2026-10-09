import request from "supertest";
import { bearer, registerUser } from "../utils/auth";
import { truncateAll } from "../utils/db";
import { createBudget } from "../utils/factories";
import { seedBaseScenario } from "../utils/scenario";
import { createTestApp, TestContext } from "../utils/test-app";

/**
 * FR-REP-004 — Mostrar cumplimiento de presupuestos.
 */
describe("FR-REP-004 · Cumplimiento de presupuestos", () => {
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

  it("reporta límite, gasto, consumo y estado por presupuesto", async () => {
    const user = await registerUser(ctx.app);
    const { expenseCategory } = await seedBaseScenario(
      ctx.app,
      user.accessToken,
    );
    await createBudget(ctx.app, user.accessToken, {
      categoryId: expenseCategory.id,
      period: "2026-03",
      limit: 1000,
      currency: "ARS",
    });

    const response = await request(ctx.server)
      .get("/api/reports/budgets?period=2026-03")
      .set(bearer(user.accessToken))
      .expect(200);

    expect(response.body[0]).toMatchObject({
      categoryName: "Comida",
      limit: 1000,
      spent: 200,
      consumedPct: 20,
      status: "available",
    });
  });
});
