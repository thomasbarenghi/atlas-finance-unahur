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
 * FR-PRE-003 — Mostrar estados disponible, advertencia y excedido.
 */
describe("FR-PRE-003 · Estados del presupuesto", () => {
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

  const statusFor = async (spent: number): Promise<string> => {
    const user = await registerUser(ctx.app);
    const account = await createAccount(ctx.app, user.accessToken);
    const category = await createCategory(ctx.app, user.accessToken, {
      name: `Cat-${Math.random().toString(36).slice(2)}`,
    });
    await createBudget(ctx.app, user.accessToken, {
      categoryId: category.id,
      period: "2026-03",
      limit: 1000,
      currency: "ARS",
    });
    await createTransaction(ctx.app, user.accessToken, {
      type: "expense",
      amount: spent,
      currency: "ARS",
      date: "2026-03-10",
      description: "Gasto",
      accountId: account.id,
      categoryId: category.id,
    });

    const response = await request(ctx.server)
      .get("/api/budgets?period=2026-03")
      .set(bearer(user.accessToken))
      .expect(200);
    return response.body[0].status;
  };

  it("reporta disponible, advertencia y excedido según el consumo", async () => {
    expect(await statusFor(300)).toBe("available"); // 30%
    expect(await statusFor(800)).toBe("warning"); // 80% (umbral)
    expect(await statusFor(1200)).toBe("exceeded"); // 120%
  });
});
