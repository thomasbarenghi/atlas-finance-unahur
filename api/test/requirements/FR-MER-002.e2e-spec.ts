import request from "supertest";
import { bearer, registerUser } from "../utils/auth";
import { truncateAll } from "../utils/db";
import { createTestApp, TestContext } from "../utils/test-app";

/**
 * FR-MER-002 — Guardar símbolo, precio, moneda, proveedor y fecha de
 * actualización (RN-010: una cotización desactualizada se marca como tal).
 */
describe("FR-MER-002 · Contrato de la cotización", () => {
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

  it("expone símbolo, precio, moneda, proveedor y fecha", async () => {
    const user = await registerUser(ctx.app);
    await ctx.dataSource.query(
      `INSERT INTO quotes (id, symbol, price, currency, provider, change_24h, fetched_at)
       VALUES (gen_random_uuid(), 'BTC', 64000, 'USD', 'binance', 1.8, now())`,
    );

    const response = await request(ctx.server)
      .get("/api/quotes")
      .set(bearer(user.accessToken))
      .expect(200);

    expect(response.body[0]).toMatchObject({
      symbol: "BTC",
      price: 64000,
      currency: "USD",
      provider: "binance",
      change24h: 1.8,
      isStale: false,
    });
    expect(typeof response.body[0].fetchedAt).toBe("string");
  });

  it("marca como desactualizada una cotización vieja conservándola", async () => {
    const user = await registerUser(ctx.app);
    const twoHoursAgo = new Date(Date.now() - 2 * 60 * 60 * 1000);
    await ctx.dataSource.query(
      `INSERT INTO quotes (id, symbol, price, currency, provider, change_24h, fetched_at)
       VALUES (gen_random_uuid(), 'ETH', 3100, 'USD', 'binance', NULL, $1)`,
      [twoHoursAgo],
    );

    const response = await request(ctx.server)
      .get("/api/quotes")
      .set(bearer(user.accessToken))
      .expect(200);

    expect(response.body[0].isStale).toBe(true);
    expect(response.body[0].fetchedAt).toBe(twoHoursAgo.toISOString());
  });
});
