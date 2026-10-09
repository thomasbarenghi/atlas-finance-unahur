import request from "supertest";
import { bearer, registerUser } from "../utils/auth";
import {
  createAccount,
  createCategory,
  createTransaction,
} from "../utils/factories";
import { truncateAll } from "../utils/db";
import { createTestApp, TestContext } from "../utils/test-app";

/**
 * FR-TRX-006 — Filtrar por rango de fechas, tipo, cuenta y categoría.
 */
describe("FR-TRX-006 · Filtros de movimientos", () => {
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

  const arrange = async () => {
    const user = await registerUser(ctx.app);
    const accountA = await createAccount(ctx.app, user.accessToken, {
      name: "A",
    });
    const accountB = await createAccount(ctx.app, user.accessToken, {
      name: "B",
    });
    const food = await createCategory(ctx.app, user.accessToken, {
      name: "Comida",
      type: "expense",
    });
    const salary = await createCategory(ctx.app, user.accessToken, {
      name: "Sueldo",
      type: "income",
    });

    await createTransaction(ctx.app, user.accessToken, {
      type: "expense",
      amount: 100,
      currency: "ARS",
      date: "2026-01-15",
      description: "Supermercado",
      accountId: accountA.id,
      categoryId: food.id,
    });
    await createTransaction(ctx.app, user.accessToken, {
      type: "income",
      amount: 900,
      currency: "ARS",
      date: "2026-02-10",
      description: "Sueldo",
      accountId: accountB.id,
      categoryId: salary.id,
    });
    await createTransaction(ctx.app, user.accessToken, {
      type: "expense",
      amount: 30,
      currency: "ARS",
      date: "2026-02-20",
      description: "Delivery",
      notes: "comida a domicilio",
      accountId: accountA.id,
      categoryId: food.id,
    });

    return { user, accountA, accountB, food, salary };
  };

  const list = async (token: string, query: string) => {
    const response = await request(ctx.server)
      .get(`/api/transactions${query}`)
      .set(bearer(token))
      .expect(200);
    return response.body;
  };

  it("filtra por rango de fechas", async () => {
    const { user } = await arrange();
    const result = await list(
      user.accessToken,
      "?from=2026-02-01&to=2026-02-28",
    );
    expect(result.total).toBe(2);
  });

  it("filtra por tipo", async () => {
    const { user } = await arrange();
    expect((await list(user.accessToken, "?type=income")).total).toBe(1);
    expect((await list(user.accessToken, "?type=expense")).total).toBe(2);
  });

  it("filtra por cuenta y por categoría", async () => {
    const { user, accountA, food } = await arrange();
    expect(
      (await list(user.accessToken, `?accountId=${accountA.id}`)).total,
    ).toBe(2);
    expect((await list(user.accessToken, `?categoryId=${food.id}`)).total).toBe(
      2,
    );
  });

  it("busca por descripción y notas", async () => {
    const { user } = await arrange();
    expect((await list(user.accessToken, "?search=Super")).total).toBe(1);
    expect((await list(user.accessToken, "?search=domicilio")).total).toBe(1);
  });

  it("pagina los resultados", async () => {
    const { user } = await arrange();
    const page = await list(user.accessToken, "?page=1&pageSize=2");
    expect(page.items).toHaveLength(2);
    expect(page.total).toBe(3);
    expect(page.totalPages).toBe(2);
  });

  it("rechaza parámetros de filtro inválidos", async () => {
    const { user } = await arrange();
    await request(ctx.server)
      .get("/api/transactions?from=01-02-2026")
      .set(bearer(user.accessToken))
      .expect(400);
    await request(ctx.server)
      .get("/api/transactions?type=refund")
      .set(bearer(user.accessToken))
      .expect(400);
    await request(ctx.server)
      .get("/api/transactions?accountId=not-a-uuid")
      .set(bearer(user.accessToken))
      .expect(400);
  });
});
