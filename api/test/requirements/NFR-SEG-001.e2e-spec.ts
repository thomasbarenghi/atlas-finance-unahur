import request from "supertest";
import { bearer, registerUser } from "../utils/auth";
import {
  categoryByName,
  createAccount,
  createTransaction,
  isoDate,
} from "../utils/factories";
import { truncateAll } from "../utils/db";
import { createTestApp, TestContext } from "../utils/test-app";

/**
 * NFR-SEG-001 — Verificar en servidor la propiedad de cada recurso antes de
 * leerlo o modificarlo. Un recurso ajeno se comporta como inexistente (404),
 * sin filtrar su existencia.
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

  it("oculta cuentas y movimientos de otro usuario", async () => {
    const alice = await registerUser(ctx.app);
    const bob = await registerUser(ctx.app);

    const account = await createAccount(ctx.app, alice.accessToken);
    const category = await categoryByName(
      ctx.app,
      alice.accessToken,
      "Supermercado",
    );
    const transaction = await createTransaction(ctx.app, alice.accessToken, {
      type: "expense",
      amount: 100,
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
      .delete(`/api/accounts/${account.id}`)
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
  });

  it("no autoriza usando el id de otro usuario en el body", async () => {
    const alice = await registerUser(ctx.app);
    const bob = await registerUser(ctx.app);
    const aliceAccount = await createAccount(ctx.app, alice.accessToken);
    const category = await categoryByName(
      ctx.app,
      bob.accessToken,
      "Supermercado",
    );

    // Bob intenta usar la cuenta de Alice: 404 (no pertenece a Bob).
    await request(ctx.server)
      .post("/api/transactions")
      .set(bearer(bob.accessToken))
      .send({
        type: "expense",
        amount: 10,
        date: isoDate(),
        description: "Intruso",
        accountId: aliceAccount.id,
        categoryId: category.id,
      })
      .expect(404);
  });
});
