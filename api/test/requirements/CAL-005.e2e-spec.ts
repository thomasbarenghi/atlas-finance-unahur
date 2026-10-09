import request from "supertest";
import { bearer, registerUser } from "../utils/auth";
import { truncateAll } from "../utils/db";
import { createPosition } from "../utils/factories";
import { createTestApp, TestContext } from "../utils/test-app";

/**
 * CAL-005 — Valor de posición = cantidad × último precio válido en la moneda del
 * instrumento.
 */
describe("CAL-005 · Valor de posición", () => {
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

  it("calcula cantidad × precio y expone la cotización usada", async () => {
    const user = await registerUser(ctx.app);
    await createPosition(ctx.app, user.accessToken, {
      symbol: "BTC",
      instrument: "Bitcoin",
      quantity: 2,
      avgCost: 100,
      currency: "USD",
    });
    await ctx.dataSource.query(
      `INSERT INTO quotes (id, symbol, price, currency, provider, change_24h, fetched_at)
       VALUES (gen_random_uuid(), 'BTC', 150, 'USD', 'binance', NULL, now())`,
    );

    const response = await request(ctx.server)
      .get("/api/positions")
      .set(bearer(user.accessToken))
      .expect(200);

    expect(response.body[0]).toMatchObject({
      currentPrice: 150,
      currentValue: 300,
      quoteProvider: "binance",
      isStale: false,
    });
  });

  it("deja el valor nulo cuando no hay cotización", async () => {
    const user = await registerUser(ctx.app);
    await createPosition(ctx.app, user.accessToken, {
      symbol: "BTC",
      instrument: "Bitcoin",
      quantity: 2,
      avgCost: 100,
      currency: "USD",
    });

    const response = await request(ctx.server)
      .get("/api/positions")
      .set(bearer(user.accessToken))
      .expect(200);

    expect(response.body[0].currentValue).toBeNull();
    expect(response.body[0].currentPrice).toBeNull();
  });
});
