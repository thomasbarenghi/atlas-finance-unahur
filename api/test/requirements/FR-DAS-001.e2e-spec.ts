import { bearer, registerUser } from "../utils/auth";
import { truncateAll } from "../utils/db";
import { createAccount } from "../utils/factories";
import { getDashboard, seedBaseScenario } from "../utils/scenario";
import { createTestApp, TestContext } from "../utils/test-app";
import request from "supertest";

/**
 * FR-DAS-001 — Mostrar patrimonio neto, ingresos, gastos y ahorro del período
 * seleccionado.
 */
describe("FR-DAS-001 · KPIs del período", () => {
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

  it("calcula ingresos, gastos, ahorro y patrimonio neto", async () => {
    const user = await registerUser(ctx.app);
    await seedBaseScenario(ctx.app, user.accessToken);

    const dashboard = await getDashboard(ctx.app, user.accessToken);

    expect(dashboard.period).toEqual({ from: "2026-01-01", to: "2026-03-31" });
    expect(dashboard.currency).toBe("ARS");
    expect(dashboard.kpis).toMatchObject({
      income: 500,
      expenses: 200,
      savings: 300,
      accounts: 1300,
      assets: 0,
      debts: 0,
      netWorth: 1300,
    });
  });

  it("excluye transferencias de ingresos y gastos (CAL-003)", async () => {
    const user = await registerUser(ctx.app);
    const { account } = await seedBaseScenario(ctx.app, user.accessToken);
    const other = await createAccount(ctx.app, user.accessToken, {
      name: "Otra",
      initialBalance: 0,
    });

    await request(ctx.server)
      .post("/api/transactions")
      .set(bearer(user.accessToken))
      .send({
        type: "transfer",
        amount: 400,
        currency: "ARS",
        date: "2026-03-20",
        description: "Ahorro",
        accountId: account.id,
        transferAccountId: other.id,
      })
      .expect(201);

    const dashboard = await getDashboard(ctx.app, user.accessToken);
    expect(dashboard.kpis.income).toBe(500);
    expect(dashboard.kpis.expenses).toBe(200);
  });

  it("responde al período seleccionado", async () => {
    const user = await registerUser(ctx.app);
    await seedBaseScenario(ctx.app, user.accessToken);

    const empty = await getDashboard(
      ctx.app,
      user.accessToken,
      "from=2026-04-01&to=2026-04-30",
    );
    expect(empty.kpis.income).toBe(0);
    expect(empty.kpis.expenses).toBe(0);
  });

  it("exige sesión", async () => {
    await request(ctx.server).get("/api/dashboard").expect(401);
  });
});
