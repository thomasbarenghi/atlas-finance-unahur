import request from "supertest";
import { bearer, registerUser } from "../utils/auth";
import { createBudget, createCategory } from "../utils/factories";
import { truncateAll } from "../utils/db";
import { createTestApp, TestContext } from "../utils/test-app";

/**
 * FR-PRE-001 — Crear un presupuesto mensual por categoría y moneda.
 */
describe("FR-PRE-001 · Creación de presupuesto", () => {
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

  it("crea un presupuesto mensual y normaliza el período", async () => {
    const user = await registerUser(ctx.app);
    const category = await createCategory(ctx.app, user.accessToken, {
      name: "Comida",
    });

    const budget = await createBudget(ctx.app, user.accessToken, {
      categoryId: category.id,
      period: "2026-03",
      limit: 80000,
      currency: "ARS",
    });

    expect(budget).toMatchObject({
      categoryId: category.id,
      period: "2026-03-01",
      limit: 80000,
      currency: "ARS",
      recurring: false,
      spent: 0,
      status: "available",
    });
    expect(budget.category).toMatchObject({ name: "Comida" });
  });

  it("rechaza un presupuesto duplicado con 409 DUPLICATE_BUDGET", async () => {
    const user = await registerUser(ctx.app);
    const category = await createCategory(ctx.app, user.accessToken);
    await createBudget(ctx.app, user.accessToken, {
      categoryId: category.id,
      period: "2026-03",
      limit: 1000,
      currency: "ARS",
    });

    const response = await request(ctx.server)
      .post("/api/budgets")
      .set(bearer(user.accessToken))
      .send({
        categoryId: category.id,
        period: "2026-03",
        limit: 2000,
        currency: "ARS",
      })
      .expect(409);
    expect(response.body.code).toBe("DUPLICATE_BUDGET");
  });

  it("exige una categoría de gasto", async () => {
    const user = await registerUser(ctx.app);
    const income = await createCategory(ctx.app, user.accessToken, {
      name: "Sueldo",
      type: "income",
    });

    const response = await request(ctx.server)
      .post("/api/budgets")
      .set(bearer(user.accessToken))
      .send({
        categoryId: income.id,
        period: "2026-03",
        limit: 1000,
        currency: "ARS",
      })
      .expect(400);
    expect(response.body.fieldErrors.categoryId).toBeDefined();
  });

  it("rechaza un período inválido y un límite negativo", async () => {
    const user = await registerUser(ctx.app);
    const category = await createCategory(ctx.app, user.accessToken);

    await request(ctx.server)
      .post("/api/budgets")
      .set(bearer(user.accessToken))
      .send({
        categoryId: category.id,
        period: "marzo 2026",
        limit: 1000,
        currency: "ARS",
      })
      .expect(400);
    await request(ctx.server)
      .post("/api/budgets")
      .set(bearer(user.accessToken))
      .send({
        categoryId: category.id,
        period: "2026-03",
        limit: -5,
        currency: "ARS",
      })
      .expect(400);
  });
});
