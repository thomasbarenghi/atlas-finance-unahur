import request from "supertest";
import { bearer, registerUser } from "../utils/auth";
import { truncateAll } from "../utils/db";
import { seedBaseScenario } from "../utils/scenario";
import { createTestApp, TestContext } from "../utils/test-app";

/**
 * CAL-002 / CAL-003 — Flujo de fondos = Σ ingresos − Σ gastos; las
 * transferencias se excluyen.
 */
describe("CAL-002 · Flujo de fondos", () => {
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

  it("calcula ingresos − gastos del período", async () => {
    const user = await registerUser(ctx.app);
    await seedBaseScenario(ctx.app, user.accessToken);

    const summary = await request(ctx.server)
      .get("/api/reports/summary?from=2026-01-01&to=2026-03-31")
      .set(bearer(user.accessToken))
      .expect(200);

    expect(summary.body.income).toBe(500);
    expect(summary.body.expenses).toBe(200);
    expect(summary.body.savings).toBe(300);
  });
});
