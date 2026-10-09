import request from "supertest";
import { bearer, registerUser } from "../utils/auth";
import { createGoal } from "../utils/factories";
import { truncateAll } from "../utils/db";
import { createTestApp, TestContext } from "../utils/test-app";

/**
 * FR-OBJ-003 — Actualizar el monto acumulado de manera manual.
 */
describe("FR-OBJ-003 · Actualizar el acumulado", () => {
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

  it("actualiza savedAmount y recalcula el progreso", async () => {
    const user = await registerUser(ctx.app);
    const goal = await createGoal(ctx.app, user.accessToken, {
      name: "Vacaciones",
      targetAmount: 1000,
      savedAmount: 100,
      currency: "ARS",
    });
    expect(goal.progressPct).toBe(10);

    const updated = await request(ctx.server)
      .patch(`/api/goals/${goal.id}`)
      .set(bearer(user.accessToken))
      .send({ savedAmount: 500 })
      .expect(200);

    expect(updated.body.savedAmount).toBe(500);
    expect(updated.body.progressPct).toBe(50);
  });

  it("rechaza un acumulado negativo", async () => {
    const user = await registerUser(ctx.app);
    const goal = await createGoal(ctx.app, user.accessToken, {
      name: "X",
      targetAmount: 1000,
      currency: "ARS",
    });

    await request(ctx.server)
      .patch(`/api/goals/${goal.id}`)
      .set(bearer(user.accessToken))
      .send({ savedAmount: -10 })
      .expect(400);
  });
});
