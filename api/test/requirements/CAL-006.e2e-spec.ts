import request from "supertest";
import { bearer, registerUser } from "../utils/auth";
import { truncateAll } from "../utils/db";
import { createPosition } from "../utils/factories";
import { createTestApp, TestContext } from "../utils/test-app";

/**
 * CAL-006 — Ganancia o pérdida nominal = valor actual − costo acumulado.
 */
describe("CAL-006 · Ganancia/pérdida de posición", () => {
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

  it("calcula la ganancia y el porcentaje sobre el costo", async () => {
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
      costBasis: 200,
      currentValue: 300,
      profitLoss: 100,
      profitLossPct: 50,
    });
  });
});
