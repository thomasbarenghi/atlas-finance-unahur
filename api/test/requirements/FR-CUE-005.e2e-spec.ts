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
 * FR-CUE-005 — Una cuenta archivada conservará su historial y no admitirá nuevos
 * movimientos.
 */
describe("FR-CUE-005 · Cuenta archivada", () => {
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

  it("rechaza nuevos movimientos y conserva el historial", async () => {
    const user = await registerUser(ctx.app);
    const account = await createAccount(ctx.app, user.accessToken);
    const category = await createCategory(ctx.app, user.accessToken);

    const movement = await createTransaction(ctx.app, user.accessToken, {
      type: "expense",
      amount: 100,
      currency: "ARS",
      date: isoDate(),
      description: "Antes de archivar",
      accountId: account.id,
      categoryId: category.id,
    });

    await request(ctx.server)
      .post(`/api/accounts/${account.id}/archive`)
      .set(bearer(user.accessToken))
      .expect(201);

    const rejected = await request(ctx.server)
      .post("/api/transactions")
      .set(bearer(user.accessToken))
      .send({
        type: "expense",
        amount: 50,
        currency: "ARS",
        date: isoDate(),
        description: "Después de archivar",
        accountId: account.id,
        categoryId: category.id,
      })
      .expect(409);
    expect(rejected.body.code).toBe("ACCOUNT_ARCHIVED");

    const history = await request(ctx.server)
      .get("/api/transactions")
      .set(bearer(user.accessToken))
      .expect(200);
    expect(
      history.body.items.some((t: { id: string }) => t.id === movement.id),
    ).toBe(true);
  });
});
