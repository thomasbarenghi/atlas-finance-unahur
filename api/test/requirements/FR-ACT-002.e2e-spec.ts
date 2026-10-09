import request from "supertest";
import { bearer, registerUser } from "../utils/auth";
import { createDebt } from "../utils/factories";
import { truncateAll } from "../utils/db";
import { createTestApp, TestContext } from "../utils/test-app";

/**
 * FR-ACT-002 — Crear deudas de tipo préstamo, hipoteca, tarjeta u otra.
 */
describe("FR-ACT-002 · Tipos de deuda", () => {
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

  it.each(["loan", "mortgage", "card", "other"])(
    "crea una deuda de tipo %s",
    async (type) => {
      const user = await registerUser(ctx.app);
      const debt = await createDebt(ctx.app, user.accessToken, {
        name: "Deuda",
        type,
        balance: 1000,
        currency: "ARS",
        date: "2026-03-01",
      });
      expect(debt.type).toBe(type);
    },
  );

  it("rechaza un tipo de deuda inválido", async () => {
    const user = await registerUser(ctx.app);

    await request(ctx.server)
      .post("/api/debts")
      .set(bearer(user.accessToken))
      .send({
        name: "X",
        type: "favor",
        balance: 1,
        currency: "ARS",
        date: "2026-03-01",
      })
      .expect(400);
  });
});
