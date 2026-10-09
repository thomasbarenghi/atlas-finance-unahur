import request from "supertest";
import { bearer, registerUser } from "../utils/auth";
import { truncateAll } from "../utils/db";
import { createTestApp, TestContext } from "../utils/test-app";

/**
 * FR-AUT-005 — El usuario podrá elegir una moneda base para consolidación y
 * reportes.
 */
describe("FR-AUT-005 · Moneda base", () => {
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

  it("expone las monedas soportadas", async () => {
    const user = await registerUser(ctx.app);
    const response = await request(ctx.server)
      .get("/api/currencies")
      .set(bearer(user.accessToken))
      .expect(200);

    expect(response.body.default).toBe("ARS");
    expect(response.body.supported).toEqual(
      expect.arrayContaining(["ARS", "USD", "EUR"]),
    );
  });

  it("actualiza la moneda base y la refleja en el perfil", async () => {
    const user = await registerUser(ctx.app);

    const updated = await request(ctx.server)
      .patch("/api/users/me")
      .set(bearer(user.accessToken))
      .send({ baseCurrency: "usd" })
      .expect(200);
    expect(updated.body.baseCurrency).toBe("USD");

    const me = await request(ctx.server)
      .get("/api/auth/me")
      .set(bearer(user.accessToken))
      .expect(200);
    expect(me.body.baseCurrency).toBe("USD");
  });

  it("rechaza una moneda no soportada con fieldErrors", async () => {
    const user = await registerUser(ctx.app);

    const response = await request(ctx.server)
      .patch("/api/users/me")
      .set(bearer(user.accessToken))
      .send({ baseCurrency: "GBP" })
      .expect(400);

    expect(response.body.code).toBe("VALIDATION_ERROR");
    expect(response.body.fieldErrors.baseCurrency).toBeDefined();
  });
});
