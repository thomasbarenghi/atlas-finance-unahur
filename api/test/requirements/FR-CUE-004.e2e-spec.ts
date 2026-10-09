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
 * FR-CUE-004 — Calcular el saldo actual a partir del saldo inicial y los
 * movimientos asociados.
 */
describe("FR-CUE-004 · Saldo actual", () => {
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

  it("calcula saldo inicial + ingresos − gastos", async () => {
    const user = await registerUser(ctx.app);
    const account = await createAccount(ctx.app, user.accessToken, {
      initialBalance: 1000,
    });
    const income = await createCategory(ctx.app, user.accessToken, {
      name: "Sueldo",
      type: "income",
    });
    const expense = await createCategory(ctx.app, user.accessToken, {
      name: "Comida",
      type: "expense",
    });

    await createTransaction(ctx.app, user.accessToken, {
      type: "income",
      amount: 500,
      currency: "ARS",
      date: isoDate(),
      description: "Sueldo",
      accountId: account.id,
      categoryId: income.id,
    });
    await createTransaction(ctx.app, user.accessToken, {
      type: "expense",
      amount: 200,
      currency: "ARS",
      date: isoDate(),
      description: "Comida",
      accountId: account.id,
      categoryId: expense.id,
    });

    const detail = await request(ctx.server)
      .get(`/api/accounts/${account.id}`)
      .set(bearer(user.accessToken))
      .expect(200);
    expect(detail.body.currentBalance).toBe(1300);

    const list = await request(ctx.server)
      .get("/api/accounts")
      .set(bearer(user.accessToken))
      .expect(200);
    expect(list.body[0].currentBalance).toBe(1300);
  });

  it("refleja el efecto opuesto de una transferencia en cada cuenta", async () => {
    const user = await registerUser(ctx.app);
    const origin = await createAccount(ctx.app, user.accessToken, {
      name: "Origen",
      initialBalance: 1000,
    });
    const destination = await createAccount(ctx.app, user.accessToken, {
      name: "Destino",
      initialBalance: 0,
    });

    await createTransaction(ctx.app, user.accessToken, {
      type: "transfer",
      amount: 300,
      currency: "ARS",
      date: isoDate(),
      description: "Ahorro",
      accountId: origin.id,
      transferAccountId: destination.id,
    });

    const accounts = await request(ctx.server)
      .get("/api/accounts")
      .set(bearer(user.accessToken))
      .expect(200);

    const byName = new Map(
      accounts.body.map((a: { name: string; currentBalance: number }) => [
        a.name,
        a.currentBalance,
      ]),
    );
    expect(byName.get("Origen")).toBe(700);
    expect(byName.get("Destino")).toBe(300);
  });
});
