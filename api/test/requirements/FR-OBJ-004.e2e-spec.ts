import { registerUser } from "../utils/auth";
import { createGoal } from "../utils/factories";
import { truncateAll } from "../utils/db";
import { createTestApp, TestContext } from "../utils/test-app";

/**
 * FR-OBJ-004 — Mostrar estados pendiente, en curso, alcanzado o vencido.
 */
describe("FR-OBJ-004 · Estados del objetivo", () => {
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

  it("pending cuando no hay acumulado", async () => {
    const user = await registerUser(ctx.app);
    const goal = await createGoal(ctx.app, user.accessToken, {
      name: "Nuevo",
      targetAmount: 1000,
      currency: "ARS",
    });
    expect(goal.status).toBe("pending");
  });

  it("in_progress cuando hay avance sin alcanzar la meta", async () => {
    const user = await registerUser(ctx.app);
    const goal = await createGoal(ctx.app, user.accessToken, {
      name: "En curso",
      targetAmount: 1000,
      savedAmount: 300,
      currency: "ARS",
      targetDate: "2999-01-01",
    });
    expect(goal.status).toBe("in_progress");
  });

  it("achieved cuando el acumulado alcanza la meta", async () => {
    const user = await registerUser(ctx.app);
    const goal = await createGoal(ctx.app, user.accessToken, {
      name: "Alcanzado",
      targetAmount: 1000,
      savedAmount: 1000,
      currency: "ARS",
    });
    expect(goal.status).toBe("achieved");
  });

  it("overdue cuando venció sin alcanzar la meta", async () => {
    const user = await registerUser(ctx.app);
    const goal = await createGoal(ctx.app, user.accessToken, {
      name: "Vencido",
      targetAmount: 1000,
      savedAmount: 200,
      currency: "ARS",
      targetDate: "2020-01-01",
    });
    expect(goal.status).toBe("overdue");
  });
});
