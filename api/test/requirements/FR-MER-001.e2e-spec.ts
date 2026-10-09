import request from "supertest";
import { bearer, registerUser } from "../utils/auth";
import { truncateAll } from "../utils/db";
import { createTestApp, TestContext } from "../utils/test-app";

/**
 * FR-MER-001 — Consultar precios para un catálogo limitado de criptomonedas
 * definido por el sistema.
 */
describe("FR-MER-001 · Catálogo de cotizaciones", () => {
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

  const insertQuote = (symbol: string, price: number, ageMs = 0) =>
    ctx.dataSource.query(
      `INSERT INTO quotes (id, symbol, price, currency, provider, change_24h, fetched_at)
       VALUES (gen_random_uuid(), $1, $2, 'USD', 'test', NULL, $3)`,
      [symbol, price, new Date(Date.now() - ageMs)],
    );

  it("devuelve las cotizaciones almacenadas y no inventa otras", async () => {
    const user = await registerUser(ctx.app);
    await insertQuote("BTC", 64000);
    await insertQuote("ETH", 3100);

    const response = await request(ctx.server)
      .get("/api/quotes")
      .set(bearer(user.accessToken))
      .expect(200);

    const symbols = response.body.map((q: { symbol: string }) => q.symbol);
    expect(symbols).toEqual(["BTC", "ETH"]);
    expect(symbols).not.toContain("DOGE");
  });

  it("requiere sesión", async () => {
    await request(ctx.server).get("/api/quotes").expect(401);
  });
});
