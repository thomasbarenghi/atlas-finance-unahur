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
 * FR-TRX-001 — Crear movimientos de tipo ingreso, gasto o transferencia.
 */
describe("FR-TRX-001 · Tipos de movimiento", () => {
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

  it("crea un ingreso y un gasto", async () => {
    const user = await registerUser(ctx.app);
    const account = await createAccount(ctx.app, user.accessToken);
    const income = await createCategory(ctx.app, user.accessToken, {
      name: "Sueldo",
      type: "income",
    });
    const expense = await createCategory(ctx.app, user.accessToken, {
      name: "Comida",
      type: "expense",
    });

    const gained = await createTransaction(ctx.app, user.accessToken, {
      type: "income",
      amount: 1000,
      currency: "ARS",
      date: isoDate(),
      description: "Sueldo",
      accountId: account.id,
      categoryId: income.id,
    });
    expect(gained.type).toBe("income");

    const spent = await createTransaction(ctx.app, user.accessToken, {
      type: "expense",
      amount: 250,
      currency: "ARS",
      date: isoDate(),
      description: "Comida",
      accountId: account.id,
      categoryId: expense.id,
    });
    expect(spent.type).toBe("expense");
  });

  it("crea una transferencia entre dos cuentas propias", async () => {
    const user = await registerUser(ctx.app);
    const origin = await createAccount(ctx.app, user.accessToken, {
      name: "Origen",
    });
    const destination = await createAccount(ctx.app, user.accessToken, {
      name: "Destino",
    });

    const transfer = await createTransaction(ctx.app, user.accessToken, {
      type: "transfer",
      amount: 300,
      currency: "ARS",
      date: isoDate(),
      description: "Ahorro",
      accountId: origin.id,
      transferAccountId: destination.id,
    });

    expect(transfer.type).toBe("transfer");
    expect(transfer.transferGroupId).toBeTruthy();
  });

  it("rechaza un tipo de movimiento inválido", async () => {
    const user = await registerUser(ctx.app);
    const account = await createAccount(ctx.app, user.accessToken);

    const response = await request(ctx.server)
      .post("/api/transactions")
      .set(bearer(user.accessToken))
      .send({
        type: "refund",
        amount: 100,
        currency: "ARS",
        date: isoDate(),
        description: "X",
        accountId: account.id,
      })
      .expect(400);

    expect(response.body.code).toBe("VALIDATION_ERROR");
    expect(response.body.fieldErrors.type).toBeDefined();
  });
});
