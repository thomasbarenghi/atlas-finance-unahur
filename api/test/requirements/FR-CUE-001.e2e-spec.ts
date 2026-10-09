import request from "supertest";
import { bearer, registerUser } from "../utils/auth";
import { createAccount } from "../utils/factories";
import { truncateAll } from "../utils/db";
import { createTestApp, TestContext } from "../utils/test-app";

/**
 * FR-CUE-001 — Crear cuentas de efectivo, bancaria manual, billetera, tarjeta u
 * otra.
 */
describe("FR-CUE-001 · Tipos de cuenta", () => {
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

  it.each(["cash", "bank", "wallet", "card", "other"])(
    "crea una cuenta de tipo %s",
    async (type) => {
      const user = await registerUser(ctx.app);
      const account = await createAccount(ctx.app, user.accessToken, { type });
      expect(account.type).toBe(type);
    },
  );

  it("rechaza un tipo de cuenta inválido", async () => {
    const user = await registerUser(ctx.app);

    const response = await request(ctx.server)
      .post("/api/accounts")
      .set(bearer(user.accessToken))
      .send({ name: "X", type: "crypto", currency: "ARS" })
      .expect(400);

    expect(response.body.code).toBe("VALIDATION_ERROR");
    expect(response.body.fieldErrors.type).toBeDefined();
  });

  it("lista solo las cuentas del usuario", async () => {
    const user = await registerUser(ctx.app);
    await createAccount(ctx.app, user.accessToken, { name: "A" });
    await createAccount(ctx.app, user.accessToken, { name: "B" });

    const response = await request(ctx.server)
      .get("/api/accounts")
      .set(bearer(user.accessToken))
      .expect(200);

    expect(response.body).toHaveLength(2);
    expect(response.body.map((a: { name: string }) => a.name).sort()).toEqual([
      "A",
      "B",
    ]);
  });
});
