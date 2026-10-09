import request from "supertest";
import { bearer, registerUser } from "../utils/auth";
import { createAccount, createGoal } from "../utils/factories";
import { MISSING_UUID, truncateAll } from "../utils/db";
import { createTestApp, TestContext } from "../utils/test-app";

/**
 * FR-OBJ-001 — Crear un objetivo con nombre, monto meta, moneda y fecha objetivo
 * opcional.
 */
describe("FR-OBJ-001 · Creación de objetivo", () => {
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

  it("crea un objetivo con todos los campos", async () => {
    const user = await registerUser(ctx.app);
    const goal = await createGoal(ctx.app, user.accessToken, {
      name: "Vacaciones",
      targetAmount: 500000,
      savedAmount: 120000,
      currency: "ARS",
      targetDate: "2027-01-01",
    });

    expect(goal).toMatchObject({
      name: "Vacaciones",
      targetAmount: 500000,
      savedAmount: 120000,
      currency: "ARS",
      targetDate: "2027-01-01",
      sourceAccountId: null,
      archived: false,
    });
  });

  it("permite omitir la fecha objetivo y el acumulado", async () => {
    const user = await registerUser(ctx.app);
    const goal = await createGoal(ctx.app, user.accessToken, {
      name: "Fondo",
      targetAmount: 1000,
      currency: "USD",
    });

    expect(goal.targetDate).toBeNull();
    expect(goal.savedAmount).toBe(0);
  });

  it("rechaza montos negativos y fechas inválidas", async () => {
    const user = await registerUser(ctx.app);

    await request(ctx.server)
      .post("/api/goals")
      .set(bearer(user.accessToken))
      .send({ name: "X", targetAmount: -1, currency: "ARS" })
      .expect(400);
    await request(ctx.server)
      .post("/api/goals")
      .set(bearer(user.accessToken))
      .send({
        name: "X",
        targetAmount: 1,
        currency: "ARS",
        targetDate: "01/2027",
      })
      .expect(400);
  });

  it("rechaza una cuenta de origen ajena o inexistente", async () => {
    const user = await registerUser(ctx.app);

    const response = await request(ctx.server)
      .post("/api/goals")
      .set(bearer(user.accessToken))
      .send({
        name: "X",
        targetAmount: 100,
        currency: "ARS",
        sourceAccountId: MISSING_UUID,
      })
      .expect(404);
    expect(response.body.code).toBe("NOT_FOUND");
  });

  it("asocia una cuenta de origen propia", async () => {
    const user = await registerUser(ctx.app);
    const account = await createAccount(ctx.app, user.accessToken);
    const goal = await createGoal(ctx.app, user.accessToken, {
      name: "Auto",
      targetAmount: 100000,
      currency: "ARS",
      sourceAccountId: account.id,
    });

    expect(goal.sourceAccountId).toBe(account.id);
  });
});
