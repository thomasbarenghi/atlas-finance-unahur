import { registerUser } from "../utils/auth";
import { truncateAll } from "../utils/db";
import { createGoal } from "../utils/factories";
import { createTestApp, TestContext } from "../utils/test-app";

/**
 * CAL-007 — Progreso de objetivo = acumulado / meta × 100, con mínimo 0%.
 */
describe("CAL-007 · Progreso de objetivo", () => {
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

  it("calcula acumulado / meta × 100", async () => {
    const user = await registerUser(ctx.app);
    const goal = await createGoal(ctx.app, user.accessToken, {
      name: "Vacaciones",
      targetAmount: 2000,
      savedAmount: 500,
      currency: "ARS",
    });
    expect(goal.progressPct).toBe(25);
  });
});
