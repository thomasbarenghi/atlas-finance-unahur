import request from "supertest";
import { bearer, registerUser } from "../utils/auth";
import {
  createAccount,
  createCategory,
  createTransaction,
  isoDate,
} from "../utils/factories";
import { truncateAll } from "../utils/db";
import { createTestApp, TestContext } from "../utils/test-app";

/**
 * FR-TRX-002 — Registrar monto positivo, moneda, fecha, cuenta, categoría,
 * descripción y notas opcionales.
 */
describe("FR-TRX-002 · Campos del movimiento", () => {
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

  it("devuelve el contrato completo del movimiento", async () => {
    const user = await registerUser(ctx.app);
    const account = await createAccount(ctx.app, user.accessToken);
    const category = await createCategory(ctx.app, user.accessToken);

    const created = await createTransaction(ctx.app, user.accessToken, {
      type: "expense",
      amount: 1200,
      currency: "ARS",
      date: "2026-03-10",
      description: "Supermercado",
      notes: "con tarjeta",
      accountId: account.id,
      categoryId: category.id,
    });

    expect(created).toMatchObject({
      type: "expense",
      amount: 1200,
      currency: "ARS",
      date: "2026-03-10",
      description: "Supermercado",
      notes: "con tarjeta",
      accountId: account.id,
      categoryId: category.id,
      transferAccountId: null,
      transferGroupId: null,
    });
  });

  it("permite omitir las notas", async () => {
    const user = await registerUser(ctx.app);
    const account = await createAccount(ctx.app, user.accessToken);
    const category = await createCategory(ctx.app, user.accessToken);

    const created = await createTransaction(ctx.app, user.accessToken, {
      type: "expense",
      amount: 10,
      currency: "ARS",
      date: isoDate(),
      description: "Sin notas",
      accountId: account.id,
      categoryId: category.id,
    });
    expect(created.notes).toBeNull();
  });

  it("exige un monto mayor que cero", async () => {
    const user = await registerUser(ctx.app);
    const account = await createAccount(ctx.app, user.accessToken);
    const category = await createCategory(ctx.app, user.accessToken);

    for (const amount of [0, -50]) {
      const response = await request(ctx.server)
        .post("/api/transactions")
        .set(bearer(user.accessToken))
        .send({
          type: "expense",
          amount,
          currency: "ARS",
          date: isoDate(),
          description: "X",
          accountId: account.id,
          categoryId: category.id,
        })
        .expect(400);
      expect(response.body.fieldErrors.amount).toBeDefined();
    }
  });

  it("exige que la moneda coincida con la de la cuenta", async () => {
    const user = await registerUser(ctx.app);
    const account = await createAccount(ctx.app, user.accessToken, {
      currency: "ARS",
    });
    const category = await createCategory(ctx.app, user.accessToken);

    const response = await request(ctx.server)
      .post("/api/transactions")
      .set(bearer(user.accessToken))
      .send({
        type: "expense",
        amount: 10,
        currency: "USD",
        date: isoDate(),
        description: "X",
        accountId: account.id,
        categoryId: category.id,
      })
      .expect(400);
    expect(response.body.fieldErrors.currency).toBeDefined();
  });

  it("exige una categoría para ingresos y gastos", async () => {
    const user = await registerUser(ctx.app);
    const account = await createAccount(ctx.app, user.accessToken);

    const response = await request(ctx.server)
      .post("/api/transactions")
      .set(bearer(user.accessToken))
      .send({
        type: "expense",
        amount: 10,
        currency: "ARS",
        date: isoDate(),
        description: "X",
        accountId: account.id,
      })
      .expect(400);
    expect(response.body.code).toBe("VALIDATION_ERROR");
  });

  it("rechaza una fecha con formato inválido", async () => {
    const user = await registerUser(ctx.app);
    const account = await createAccount(ctx.app, user.accessToken);
    const category = await createCategory(ctx.app, user.accessToken);

    await request(ctx.server)
      .post("/api/transactions")
      .set(bearer(user.accessToken))
      .send({
        type: "expense",
        amount: 10,
        currency: "ARS",
        date: "10/03/2026",
        description: "X",
        accountId: account.id,
        categoryId: category.id,
      })
      .expect(400);
  });
});
