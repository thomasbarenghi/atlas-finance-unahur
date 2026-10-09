import { registerUser } from "../utils/auth";
import { truncateAll } from "../utils/db";
import { getDashboard, seedBaseScenario } from "../utils/scenario";
import { createTestApp, TestContext } from "../utils/test-app";

/**
 * FR-DAS-004 — Distribuir los gastos por categoría.
 */
describe("FR-DAS-004 · Gastos por categoría", () => {
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

  it("distribuye los gastos del período por categoría", async () => {
    const user = await registerUser(ctx.app);
    const { expenseCategory } = await seedBaseScenario(
      ctx.app,
      user.accessToken,
    );

    const dashboard = await getDashboard(ctx.app, user.accessToken);

    expect(dashboard.expensesByCategory).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          categoryId: expenseCategory.id,
          name: "Comida",
          value: 200,
        }),
      ]),
    );
  });
});
