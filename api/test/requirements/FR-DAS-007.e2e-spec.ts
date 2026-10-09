import request from "supertest";
import { bearer, registerUser } from "../utils/auth";
import { truncateAll } from "../utils/db";
import { createAccount } from "../utils/factories";
import { seedBaseScenario } from "../utils/scenario";
import { createTestApp, TestContext } from "../utils/test-app";

/**
 * FR-DAS-007 — Permitir cambiar el período de visualización. La moneda de
 * visualización es la moneda base (o el override explícito del query).
 */
describe("FR-DAS-007 · Período y moneda de visualización", () => {
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

  it("convierte los totales a la moneda solicitada (moneda base ARS)", async () => {
    const user = await registerUser(ctx.app);
    await createAccount(ctx.app, user.accessToken, {
      name: "Ahorro USD",
      currency: "USD",
      initialBalance: 100,
    });

    const response = await request(ctx.server)
      .get("/api/dashboard?from=2026-01-01&to=2026-03-31&currency=ARS")
      .set(bearer(user.accessToken))
      .expect(200);

    expect(response.body.currency).toBe("ARS");
    expect(response.body.kpis.accounts).toBe(100000); // 100 USD × 1000
  });

  it("usa la moneda base cuando no se envía override", async () => {
    const user = await registerUser(ctx.app);
    await seedBaseScenario(ctx.app, user.accessToken);

    const response = await request(ctx.server)
      .get("/api/dashboard?from=2026-01-01&to=2026-03-31")
      .set(bearer(user.accessToken))
      .expect(200);

    expect(response.body.currency).toBe("ARS");
  });
});
