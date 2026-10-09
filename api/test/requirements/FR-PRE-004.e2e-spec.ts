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
 * FR-PRE-004 — Incluir solo gastos de la categoría y del período correspondiente.
 */
describe("FR-PRE-004 · Alcance del consumo", () => {
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

  it("solo cuenta gastos de la misma categoría y período", async () => {
    const user = await registerUser(ctx.app);
    const account = await createAccount(ctx.app, user.accessToken);
    const accountB = await createAccount(ctx.app, user.accessToken, {
      name: "Otra",
    });
    const food = await createCategory(ctx.app, user.accessToken, {
      name: "Comida",
    });
    const other = await createCategory(ctx.app, user.accessToken, {
      name: "Ocio",
    });
    await createBudget(ctx.app, user.accessToken, {
      categoryId: food.id,
      period: "2026-03",
      limit: 1000,
      currency: "ARS",
    });

    // Cuenta (misma categoría, mismo período)
    await createTransaction(ctx.app, user.accessToken, {
      type: "expense",
      amount: 200,
      currency: "ARS",
      date: "2026-03-10",
      description: "Comida",
      accountId: account.id,
      categoryId: food.id,
    });
    // No cuenta: otro período
    await createTransaction(ctx.app, user.accessToken, {
      type: "expense",
      amount: 999,
      currency: "ARS",
      date: "2026-04-10",
      description: "Comida abril",
      accountId: account.id,
      categoryId: food.id,
    });
    // No cuenta: otra categoría
    await createTransaction(ctx.app, user.accessToken, {
      type: "expense",
      amount: 500,
      currency: "ARS",
      date: "2026-03-12",
      description: "Ocio",
      accountId: account.id,
      categoryId: other.id,
    });
    // No cuenta: transferencia
    await createTransaction(ctx.app, user.accessToken, {
      type: "transfer",
      amount: 700,
      currency: "ARS",
      date: "2026-03-13",
      description: "Ahorro",
      accountId: account.id,
      transferAccountId: accountB.id,
    });

    const response = await request(ctx.server)
      .get("/api/budgets?period=2026-03")
      .set(bearer(user.accessToken))
      .expect(200);

    expect(response.body[0].spent).toBe(200);
  });
});
