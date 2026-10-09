import { registerUser } from "../utils/auth";
import { truncateAll } from "../utils/db";
import {
  createAccount,
  createCategory,
  createTransaction,
} from "../utils/factories";
import { getDashboard } from "../utils/scenario";
import { createTestApp, TestContext } from "../utils/test-app";

/**
 * CAL-010 — Tasa de ahorro = ahorro del período / ingresos del período × 100.
 * Su variación se expresa en puntos porcentuales.
 */
describe("CAL-010 · Variación de la tasa de ahorro", () => {
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

  it("expresa la variación en puntos porcentuales contra el período anterior", async () => {
    const user = await registerUser(ctx.app);
    const account = await createAccount(ctx.app, user.accessToken);
    const income = await createCategory(ctx.app, user.accessToken, {
      name: "Sueldo",
      type: "income",
    });
    const expense = await createCategory(ctx.app, user.accessToken, {
      name: "Gastos",
      type: "expense",
    });

    // Período anterior (ene 2026): tasa = 500/1000 = 50%
    await createTransaction(ctx.app, user.accessToken, {
      type: "income",
      amount: 1000,
      currency: "ARS",
      date: "2026-01-10",
      description: "Ingreso enero",
      accountId: account.id,
      categoryId: income.id,
    });
    await createTransaction(ctx.app, user.accessToken, {
      type: "expense",
      amount: 500,
      currency: "ARS",
      date: "2026-01-15",
      description: "Gasto enero",
      accountId: account.id,
      categoryId: expense.id,
    });

    // Período actual (feb 2026): tasa = 250/1000 = 25%
    await createTransaction(ctx.app, user.accessToken, {
      type: "income",
      amount: 1000,
      currency: "ARS",
      date: "2026-02-05",
      description: "Ingreso febrero",
      accountId: account.id,
      categoryId: income.id,
    });
    await createTransaction(ctx.app, user.accessToken, {
      type: "expense",
      amount: 750,
      currency: "ARS",
      date: "2026-02-10",
      description: "Gasto febrero",
      accountId: account.id,
      categoryId: expense.id,
    });

    const dashboard = await getDashboard(
      ctx.app,
      user.accessToken,
      "from=2026-02-01&to=2026-02-28",
    );

    // 25% - 50% = -25 puntos porcentuales.
    expect(dashboard.kpis.savingsRateDeltaPp).toBeCloseTo(-25, 1);
  });
});
