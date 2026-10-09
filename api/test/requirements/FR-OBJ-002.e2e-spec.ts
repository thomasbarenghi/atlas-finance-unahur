import { registerUser } from "../utils/auth";
import { createGoal } from "../utils/factories";
import { truncateAll } from "../utils/db";
import { createTestApp, TestContext } from "../utils/test-app";

/**
 * FR-OBJ-002 — Calcular y mostrar el porcentaje de avance (CAL-007).
 */
describe("FR-OBJ-002 · Progreso del objetivo", () => {
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

  it("calcula el porcentaje acumulado / meta", async () => {
    const user = await registerUser(ctx.app);
    const goal = await createGoal(ctx.app, user.accessToken, {
      name: "Vacaciones",
      targetAmount: 500000,
      savedAmount: 120000,
      currency: "ARS",
    });

    expect(goal.progressPct).toBe(24);
  });

  it("no baja de 0% ni trunca el avance por encima de la meta", async () => {
    const user = await registerUser(ctx.app);
    const over = await createGoal(ctx.app, user.accessToken, {
      name: "Logrado",
      targetAmount: 1000,
      savedAmount: 1500,
      currency: "ARS",
    });
    expect(over.progressPct).toBe(150);
  });

  it("devuelve 0% cuando la meta es 0 (sin división por cero)", async () => {
    const user = await registerUser(ctx.app);
    const goal = await createGoal(ctx.app, user.accessToken, {
      name: "Cero",
      targetAmount: 0,
      savedAmount: 100,
      currency: "ARS",
    });
    expect(goal.progressPct).toBe(0);
  });
});
