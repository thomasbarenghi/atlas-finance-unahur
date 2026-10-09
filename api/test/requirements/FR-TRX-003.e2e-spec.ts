import request from "supertest";
import { bearer, registerUser } from "../utils/auth";
import {
  createAccount,
  createCategory,
  createTransaction,
  isoDate,
} from "../utils/factories";
import { MISSING_UUID, truncateAll } from "../utils/db";
import { createTestApp, TestContext } from "../utils/test-app";

/**
 * FR-TRX-003 — Editar o eliminar únicamente movimientos pertenecientes al
 * usuario autenticado.
 */
describe("FR-TRX-003 · Editar y eliminar movimientos", () => {
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

  it("edita un movimiento propio", async () => {
    const user = await registerUser(ctx.app);
    const account = await createAccount(ctx.app, user.accessToken);
    const category = await createCategory(ctx.app, user.accessToken);
    const created = await createTransaction(ctx.app, user.accessToken, {
      type: "expense",
      amount: 100,
      currency: "ARS",
      date: isoDate(),
      description: "Original",
      accountId: account.id,
      categoryId: category.id,
    });

    const updated = await request(ctx.server)
      .patch(`/api/transactions/${created.id}`)
      .set(bearer(user.accessToken))
      .send({ amount: 250, description: "Editado" })
      .expect(200);

    expect(updated.body.amount).toBe(250);
    expect(updated.body.description).toBe("Editado");
  });

  it("elimina un movimiento propio", async () => {
    const user = await registerUser(ctx.app);
    const account = await createAccount(ctx.app, user.accessToken);
    const category = await createCategory(ctx.app, user.accessToken);
    const created = await createTransaction(ctx.app, user.accessToken, {
      type: "expense",
      amount: 100,
      currency: "ARS",
      date: isoDate(),
      description: "Borrar",
      accountId: account.id,
      categoryId: category.id,
    });

    await request(ctx.server)
      .delete(`/api/transactions/${created.id}`)
      .set(bearer(user.accessToken))
      .expect(200);

    await request(ctx.server)
      .get(`/api/transactions/${created.id}`)
      .set(bearer(user.accessToken))
      .expect(404);
  });

  it("responde 404 al editar o eliminar un movimiento inexistente", async () => {
    const user = await registerUser(ctx.app);
    const missing = MISSING_UUID;

    await request(ctx.server)
      .patch(`/api/transactions/${missing}`)
      .set(bearer(user.accessToken))
      .send({ amount: 1 })
      .expect(404);
    await request(ctx.server)
      .delete(`/api/transactions/${missing}`)
      .set(bearer(user.accessToken))
      .expect(404);
  });

  it("rechaza una edición que deje el gasto sin categoría", async () => {
    const user = await registerUser(ctx.app);
    const account = await createAccount(ctx.app, user.accessToken);
    const category = await createCategory(ctx.app, user.accessToken);
    const created = await createTransaction(ctx.app, user.accessToken, {
      type: "expense",
      amount: 100,
      currency: "ARS",
      date: isoDate(),
      description: "X",
      accountId: account.id,
      categoryId: category.id,
    });

    await request(ctx.server)
      .patch(`/api/transactions/${created.id}`)
      .set(bearer(user.accessToken))
      .send({ categoryId: null })
      .expect(400);
  });
});
