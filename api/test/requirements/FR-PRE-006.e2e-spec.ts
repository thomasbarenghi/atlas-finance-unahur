import request from "supertest";
import { bearer, registerUser } from "../utils/auth";
import { createBudget, createCategory } from "../utils/factories";
import { MISSING_UUID, truncateAll } from "../utils/db";
import { createTestApp, TestContext } from "../utils/test-app";

/**
 * FR-PRE-006 — Editar o eliminar presupuestos propios con confirmación.
 */
describe("FR-PRE-006 · Editar y eliminar presupuestos", () => {
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

  it("edita el límite y la recurrencia", async () => {
    const user = await registerUser(ctx.app);
    const category = await createCategory(ctx.app, user.accessToken);
    const budget = await createBudget(ctx.app, user.accessToken, {
      categoryId: category.id,
      period: "2026-03",
      limit: 1000,
      currency: "ARS",
    });

    const updated = await request(ctx.server)
      .patch(`/api/budgets/${budget.id}`)
      .set(bearer(user.accessToken))
      .send({ limit: 2000, recurring: true })
      .expect(200);

    expect(updated.body.limit).toBe(2000);
    expect(updated.body.recurring).toBe(true);
  });

  it("elimina un presupuesto propio", async () => {
    const user = await registerUser(ctx.app);
    const category = await createCategory(ctx.app, user.accessToken);
    const budget = await createBudget(ctx.app, user.accessToken, {
      categoryId: category.id,
      period: "2026-03",
      limit: 1000,
      currency: "ARS",
    });

    await request(ctx.server)
      .delete(`/api/budgets/${budget.id}`)
      .set(bearer(user.accessToken))
      .expect(200);

    const list = await request(ctx.server)
      .get("/api/budgets?period=2026-03")
      .set(bearer(user.accessToken))
      .expect(200);
    expect(list.body).toHaveLength(0);
  });

  it("responde 404 para un presupuesto inexistente", async () => {
    const user = await registerUser(ctx.app);

    await request(ctx.server)
      .patch(`/api/budgets/${MISSING_UUID}`)
      .set(bearer(user.accessToken))
      .send({ limit: 1 })
      .expect(404);
    await request(ctx.server)
      .delete(`/api/budgets/${MISSING_UUID}`)
      .set(bearer(user.accessToken))
      .expect(404);
  });
});
