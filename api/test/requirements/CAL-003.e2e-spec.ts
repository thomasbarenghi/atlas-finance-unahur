import { registerUser } from "../utils/auth";
import { truncateAll } from "../utils/db";
import { createAccount, createTransaction } from "../utils/factories";
import { getDashboard, seedBaseScenario } from "../utils/scenario";
import { createTestApp, TestContext } from "../utils/test-app";

/**
 * CAL-003 — Las transferencias se excluyen de ingresos y gastos consolidados.
 */
describe("CAL-003 · Transferencias fuera del flujo", () => {
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

  it("una transferencia no altera ingresos, gastos ni ahorro", async () => {
    const user = await registerUser(ctx.app);
    const { account } = await seedBaseScenario(ctx.app, user.accessToken);
    const other = await createAccount(ctx.app, user.accessToken, {
      name: "Otra",
      initialBalance: 0,
    });

    const before = await getDashboard(ctx.app, user.accessToken);

    await createTransaction(ctx.app, user.accessToken, {
      type: "transfer",
      amount: 400,
      currency: "ARS",
      date: "2026-03-20",
      description: "Ahorro",
      accountId: account.id,
      transferAccountId: other.id,
    });

    const after = await getDashboard(ctx.app, user.accessToken);
    expect(after.kpis.income).toBe(before.kpis.income);
    expect(after.kpis.expenses).toBe(before.kpis.expenses);
    expect(after.kpis.savings).toBe(before.kpis.savings);
  });
});
