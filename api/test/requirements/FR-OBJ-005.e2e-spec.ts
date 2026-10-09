import request from "supertest";
import { bearer, registerUser } from "../utils/auth";
import { createAccount, createGoal } from "../utils/factories";
import { truncateAll } from "../utils/db";
import { createTestApp, TestContext } from "../utils/test-app";

/**
 * FR-OBJ-005 — Vincular un objetivo con una cuenta de origen donde se acumula el
 * dinero. El objetivo no admite movimientos propios ni se suma al patrimonio
 * neto (CAL-001/RN-002).
 */
describe("FR-OBJ-005 · Cuenta de origen y patrimonio", () => {
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

  it("expone la cuenta de origen y su detalle", async () => {
    const user = await registerUser(ctx.app);
    const account = await createAccount(ctx.app, user.accessToken);
    const goal = await createGoal(ctx.app, user.accessToken, {
      name: "Vacaciones",
      targetAmount: 120000,
      savedAmount: 30000,
      currency: "ARS",
      sourceAccountId: account.id,
    });

    const detail = await request(ctx.server)
      .get(`/api/goals/${goal.id}`)
      .set(bearer(user.accessToken))
      .expect(200);
    expect(detail.body.sourceAccountId).toBe(account.id);
  });

  it("no suma el objetivo al patrimonio neto ni a las cuentas", async () => {
    const user = await registerUser(ctx.app);
    const account = await createAccount(ctx.app, user.accessToken, {
      initialBalance: 1000,
    });
    await createGoal(ctx.app, user.accessToken, {
      name: "Meta",
      targetAmount: 5000,
      savedAmount: 5000,
      currency: "ARS",
      sourceAccountId: account.id,
    });

    const dashboard = await request(ctx.server)
      .get("/api/dashboard")
      .set(bearer(user.accessToken))
      .expect(200);

    expect(dashboard.body.kpis.accounts).toBe(1000);
    expect(dashboard.body.kpis.netWorth).toBe(1000);
  });

  it("no admite movimientos propios (no hay endpoint de movimientos de meta)", async () => {
    const user = await registerUser(ctx.app);
    const account = await createAccount(ctx.app, user.accessToken);
    const goal = await createGoal(ctx.app, user.accessToken, {
      name: "Meta",
      targetAmount: 1000,
      currency: "ARS",
      sourceAccountId: account.id,
    });

    // Los objetivos no exponen un listado de movimientos propios: 404.
    await request(ctx.server)
      .get(`/api/goals/${goal.id}/transactions`)
      .set(bearer(user.accessToken))
      .expect(404);
  });
});
