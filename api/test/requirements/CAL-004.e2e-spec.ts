import request from "supertest";
import { bearer, registerUser } from "../utils/auth";
import { truncateAll } from "../utils/db";
import {
  createAccount,
  createBudget,
  createCategory,
  createTransaction,
} from "../utils/factories";
import { createTestApp, TestContext } from "../utils/test-app";

/**
 * CAL-004 — Consumo de presupuesto = gasto del período / límite × 100; si el
 * límite es 0 no se divide.
 */
describe("CAL-004 · Consumo de presupuesto", () => {
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

  const spentPct = async (limit: number, spent: number): Promise<number> => {
    const user = await registerUser(ctx.app);
    const account = await createAccount(ctx.app, user.accessToken);
    const category = await createCategory(ctx.app, user.accessToken, {
      name: `C-${Math.random().toString(36).slice(2)}`,
    });
    if (spent > 0) {
      await createTransaction(ctx.app, user.accessToken, {
        type: "expense",
        amount: spent,
        currency: "ARS",
        date: "2026-03-10",
        description: "Gasto",
        accountId: account.id,
        categoryId: category.id,
      });
    }
    await createBudget(ctx.app, user.accessToken, {
      categoryId: category.id,
      period: "2026-03",
      limit,
      currency: "ARS",
    });
    const response = await request(ctx.server)
      .get("/api/budgets?period=2026-03")
      .set(bearer(user.accessToken))
      .expect(200);
    return response.body[0].consumedPct;
  };

  it("calcula el porcentaje de consumo", async () => {
    expect(await spentPct(1000, 300)).toBe(30);
  });

  it("no divide cuando el límite es cero", async () => {
    expect(await spentPct(0, 300)).toBe(0);
  });
});
