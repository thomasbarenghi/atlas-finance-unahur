import request from "supertest";
import { bearer, registerUser } from "../utils/auth";
import { truncateAll } from "../utils/db";
import { seedBaseScenario } from "../utils/scenario";
import { createTestApp, TestContext } from "../utils/test-app";

/**
 * FR-REP-002 — Desglosar ingresos y gastos por categoría.
 */
describe("FR-REP-002 · Desglose por categoría", () => {
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

  it("desglosa gastos e ingresos por categoría con su porcentaje", async () => {
    const user = await registerUser(ctx.app);
    await seedBaseScenario(ctx.app, user.accessToken);

    const response = await request(ctx.server)
      .get("/api/reports/by-category?from=2026-01-01&to=2026-03-31")
      .set(bearer(user.accessToken))
      .expect(200);

    const rows = response.body as Array<{
      name: string;
      type: string;
      value: number;
      pct: number;
    }>;
    expect(rows).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          name: "Comida",
          type: "expense",
          value: 200,
        }),
        expect.objectContaining({ name: "Sueldo", type: "income", value: 500 }),
      ]),
    );
  });
});
