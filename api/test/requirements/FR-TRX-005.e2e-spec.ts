import request from "supertest";
import { bearer, registerUser } from "../utils/auth";
import { createAccount, createTransaction, isoDate } from "../utils/factories";
import { MISSING_UUID, truncateAll } from "../utils/db";
import { createTestApp, TestContext } from "../utils/test-app";

/**
 * FR-TRX-005 — Aplicar ambos lados de una transferencia de manera atómica; si
 * uno falla, no se guarda ninguno.
 */
describe("FR-TRX-005 · Transferencia atómica", () => {
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

  it("persiste dos filas con signos opuestos y el mismo transferGroupId", async () => {
    const user = await registerUser(ctx.app);
    const origin = await createAccount(ctx.app, user.accessToken, {
      name: "Origen",
    });
    const destination = await createAccount(ctx.app, user.accessToken, {
      name: "Destino",
    });

    const outbound = await createTransaction(ctx.app, user.accessToken, {
      type: "transfer",
      amount: 300,
      currency: "ARS",
      date: isoDate(),
      description: "Ahorro",
      accountId: origin.id,
      transferAccountId: destination.id,
    });

    const list = await request(ctx.server)
      .get("/api/transactions?type=transfer")
      .set(bearer(user.accessToken))
      .expect(200);

    expect(list.body.total).toBe(2);
    const amounts = list.body.items.map((t: { amount: number }) => t.amount);
    expect(amounts.sort((a: number, b: number) => a - b)).toEqual([-300, 300]);
    expect(
      list.body.items.every(
        (t: { transferGroupId: string }) =>
          t.transferGroupId === outbound.transferGroupId,
      ),
    ).toBe(true);
  });

  it("elimina ambos lados al borrar una transferencia", async () => {
    const user = await registerUser(ctx.app);
    const origin = await createAccount(ctx.app, user.accessToken);
    const destination = await createAccount(ctx.app, user.accessToken);
    const transfer = await createTransaction(ctx.app, user.accessToken, {
      type: "transfer",
      amount: 300,
      currency: "ARS",
      date: isoDate(),
      description: "Ahorro",
      accountId: origin.id,
      transferAccountId: destination.id,
    });

    await request(ctx.server)
      .delete(`/api/transactions/${transfer.id}`)
      .set(bearer(user.accessToken))
      .expect(200);

    const list = await request(ctx.server)
      .get("/api/transactions?type=transfer")
      .set(bearer(user.accessToken))
      .expect(200);
    expect(list.body.total).toBe(0);
  });

  it("no persiste ninguna fila si la validación falla", async () => {
    const user = await registerUser(ctx.app);
    const origin = await createAccount(ctx.app, user.accessToken);

    await request(ctx.server)
      .post("/api/transactions")
      .set(bearer(user.accessToken))
      .send({
        type: "transfer",
        amount: 300,
        currency: "ARS",
        date: isoDate(),
        description: "Destino inexistente",
        accountId: origin.id,
        transferAccountId: MISSING_UUID,
      })
      .expect(404);

    const list = await request(ctx.server)
      .get("/api/transactions")
      .set(bearer(user.accessToken))
      .expect(200);
    expect(list.body.total).toBe(0);
  });
});
