import request from "supertest";
import { bearer, registerUser } from "../utils/auth";
import {
  createAccount,
  createAsset,
  createBudget,
  createCategory,
  createDebt,
  createGoal,
  createPosition,
  createTransaction,
  isoDate,
} from "../utils/factories";
import { truncateAll } from "../utils/db";
import { createTestApp, TestContext } from "../utils/test-app";

/**
 * NFR-SEG-001 / FR-AUT-004 — Verificar en servidor la propiedad de cada recurso
 * antes de leerlo o modificarlo. Un recurso ajeno se comporta como inexistente
 * (404), sin filtrar su existencia.
 */
describe("NFR-SEG-001 · Propiedad de los recursos", () => {
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

  it("oculta cuentas, transacciones y categorías de otro usuario", async () => {
    const alice = await registerUser(ctx.app);
    const bob = await registerUser(ctx.app);

    const account = await createAccount(ctx.app, alice.accessToken);
    const category = await createCategory(ctx.app, alice.accessToken);
    const transaction = await createTransaction(ctx.app, alice.accessToken, {
      type: "expense",
      amount: 100,
      currency: "ARS",
      date: isoDate(),
      description: "Privado",
      accountId: account.id,
      categoryId: category.id,
    });

    await request(ctx.server)
      .get(`/api/accounts/${account.id}`)
      .set(bearer(bob.accessToken))
      .expect(404);
    await request(ctx.server)
      .patch(`/api/accounts/${account.id}`)
      .set(bearer(bob.accessToken))
      .send({ name: "Hackeada" })
      .expect(404);
    await request(ctx.server)
      .post(`/api/accounts/${account.id}/archive`)
      .set(bearer(bob.accessToken))
      .expect(404);
    await request(ctx.server)
      .get(`/api/transactions/${transaction.id}`)
      .set(bearer(bob.accessToken))
      .expect(404);
    await request(ctx.server)
      .delete(`/api/transactions/${transaction.id}`)
      .set(bearer(bob.accessToken))
      .expect(404);
    await request(ctx.server)
      .patch(`/api/categories/${category.id}`)
      .set(bearer(bob.accessToken))
      .send({ name: "Hackeada" })
      .expect(404);
  });

  it("oculta presupuestos, metas, activos, deudas y posiciones ajenas", async () => {
    const alice = await registerUser(ctx.app);
    const bob = await registerUser(ctx.app);

    const category = await createCategory(ctx.app, alice.accessToken);
    const budget = await createBudget(ctx.app, alice.accessToken, {
      categoryId: category.id,
      period: "2026-03",
      limit: 1000,
      currency: "ARS",
    });
    const goal = await createGoal(ctx.app, alice.accessToken, {
      name: "Meta",
      targetAmount: 1000,
      currency: "ARS",
    });
    const asset = await createAsset(ctx.app, alice.accessToken, {
      name: "Depto",
      type: "property",
      currency: "ARS",
      initialValue: 1000,
      date: "2026-03-01",
    });
    const debt = await createDebt(ctx.app, alice.accessToken, {
      name: "Hipoteca",
      type: "mortgage",
      balance: 100,
      currency: "ARS",
      date: "2026-03-01",
    });
    const position = await createPosition(ctx.app, alice.accessToken, {
      symbol: "BTC",
      instrument: "Bitcoin",
      quantity: 1,
      avgCost: 100,
      currency: "USD",
    });

    await request(ctx.server)
      .patch(`/api/budgets/${budget.id}`)
      .set(bearer(bob.accessToken))
      .send({ limit: 1 })
      .expect(404);
    await request(ctx.server)
      .delete(`/api/budgets/${budget.id}`)
      .set(bearer(bob.accessToken))
      .expect(404);
    await request(ctx.server)
      .get(`/api/goals/${goal.id}`)
      .set(bearer(bob.accessToken))
      .expect(404);
    await request(ctx.server)
      .get(`/api/assets/${asset.id}`)
      .set(bearer(bob.accessToken))
      .expect(404);
    await request(ctx.server)
      .post(`/api/assets/${asset.id}/valuations`)
      .set(bearer(bob.accessToken))
      .send({ value: 1, currency: "ARS", date: "2026-03-01" })
      .expect(404);
    await request(ctx.server)
      .patch(`/api/debts/${debt.id}`)
      .set(bearer(bob.accessToken))
      .send({ balance: 1 })
      .expect(404);
    await request(ctx.server)
      .patch(`/api/positions/${position.id}`)
      .set(bearer(bob.accessToken))
      .send({ quantity: 1 })
      .expect(404);
    await request(ctx.server)
      .delete(`/api/positions/${position.id}`)
      .set(bearer(bob.accessToken))
      .expect(404);
  });

  it("no autoriza usando el id de otro usuario en el body", async () => {
    const alice = await registerUser(ctx.app);
    const bob = await registerUser(ctx.app);
    const aliceAccount = await createAccount(ctx.app, alice.accessToken);
    const category = await createCategory(ctx.app, bob.accessToken);

    // Bob intenta usar la cuenta de Alice: 404 (no pertenece a Bob).
    await request(ctx.server)
      .post("/api/transactions")
      .set(bearer(bob.accessToken))
      .send({
        type: "expense",
        amount: 10,
        currency: "ARS",
        date: isoDate(),
        description: "Intruso",
        accountId: aliceAccount.id,
        categoryId: category.id,
      })
      .expect(404);
  });
});
