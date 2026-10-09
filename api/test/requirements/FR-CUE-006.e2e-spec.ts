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
 * FR-CUE-006 — Restaurar una cuenta archivada, conservando su historial y su
 * disponibilidad para nuevos movimientos.
 */
describe("FR-CUE-006 · Restaurar cuenta", () => {
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

  it("restaura la cuenta y habilita nuevos movimientos", async () => {
    const user = await registerUser(ctx.app);
    const account = await createAccount(ctx.app, user.accessToken);
    const category = await createCategory(ctx.app, user.accessToken);

    await request(ctx.server)
      .post(`/api/accounts/${account.id}/archive`)
      .set(bearer(user.accessToken))
      .expect(201);

    const restored = await request(ctx.server)
      .post(`/api/accounts/${account.id}/restore`)
      .set(bearer(user.accessToken))
      .expect(201);
    expect(restored.body.archived).toBe(false);

    await createTransaction(ctx.app, user.accessToken, {
      type: "expense",
      amount: 10,
      currency: "ARS",
      date: isoDate(),
      description: "Luego de restaurar",
      accountId: account.id,
      categoryId: category.id,
    });
  });
});
