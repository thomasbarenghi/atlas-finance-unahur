import request from "supertest";
import { bearer, registerUser } from "../utils/auth";
import { createAccount, isoDate } from "../utils/factories";
import { truncateAll } from "../utils/db";
import { createTestApp, TestContext } from "../utils/test-app";

/**
 * FR-TRX-004 — En una transferencia, las cuentas de origen y destino deberán ser
 * diferentes.
 */
describe("FR-TRX-004 · Transferencia entre cuentas distintas", () => {
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

  it("rechaza una transferencia a la misma cuenta", async () => {
    const user = await registerUser(ctx.app);
    const account = await createAccount(ctx.app, user.accessToken);

    const response = await request(ctx.server)
      .post("/api/transactions")
      .set(bearer(user.accessToken))
      .send({
        type: "transfer",
        amount: 100,
        currency: "ARS",
        date: isoDate(),
        description: "Misma cuenta",
        accountId: account.id,
        transferAccountId: account.id,
      })
      .expect(400);

    expect(response.body.fieldErrors.transferAccountId).toBeDefined();
  });

  it("exige la cuenta de destino", async () => {
    const user = await registerUser(ctx.app);
    const account = await createAccount(ctx.app, user.accessToken);

    const response = await request(ctx.server)
      .post("/api/transactions")
      .set(bearer(user.accessToken))
      .send({
        type: "transfer",
        amount: 100,
        currency: "ARS",
        date: isoDate(),
        description: "Sin destino",
        accountId: account.id,
      })
      .expect(400);

    expect(response.body.code).toBe("VALIDATION_ERROR");
  });
});
