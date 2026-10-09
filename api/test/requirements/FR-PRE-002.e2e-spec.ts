import request from "supertest";
import { bearer, registerUser } from "../utils/auth";
import {
  createAccount,
  createBudget,
  createCategory,
  createTransaction,
} from "../utils/factories";
import { truncateAll } from "../utils/db";
import { createTestApp, TestContext } from "../utils/test-app";

/**
 * FR-PRE-002 — Mostrar límite, gasto acumulado, disponible y porcentaje
 * consumido.
 */
describe("FR-PRE-002 · Métricas del presupuesto", () => {
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

  it("calcula gasto, disponible y porcentaje consumido", async () => {
    const user = await registerUser(ctx.app);
    const account = await createAccount(ctx.app, user.accessToken);
    const category = await createCategory(ctx.app, user.accessToken, {
      name: "Comida",
    });
    await createBudget(ctx.app, user.accessToken, {
      categoryId: category.id,
      period: "2026-03",
      limit: 1000,
      currency: "ARS",
    });

    await createTransaction(ctx.app, user.accessToken, {
      type: "expense",
      amount: 300,
      currency: "ARS",
      date: "2026-03-15",
      description: "Compra",
      accountId: account.id,
      categoryId: category.id,
    });

    const response = await request(ctx.server)
      .get("/api/budgets?period=2026-03")
      .set(bearer(user.accessToken))
      .expect(200);

    expect(response.body).toHaveLength(1);
    expect(response.body[0]).toMatchObject({
      limit: 1000,
      spent: 300,
      available: 700,
      consumedPct: 30,
      status: "available",
    });
  });

  it("no divide por cero cuando el límite es 0", async () => {
    const user = await registerUser(ctx.app);
    const category = await createCategory(ctx.app, user.accessToken);
    const budget = await createBudget(ctx.app, user.accessToken, {
      categoryId: category.id,
      period: "2026-03",
      limit: 0,
      currency: "ARS",
    });

    expect(budget.consumedPct).toBe(0);
    expect(budget.status).toBe("available");
  });
});
