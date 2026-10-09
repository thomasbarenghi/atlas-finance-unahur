import { BudgetTools } from "./budget.tools";

const budget = (overrides: Record<string, unknown> = {}) => ({
  id: "b1",
  categoryId: "c1",
  category: { name: "Comida" },
  period: "2026-03-01",
  limit: 1000,
  currency: "ARS",
  recurring: false,
  ...overrides,
});

const build = () => {
  const budgets = {
    listBudgets: jest.fn().mockResolvedValue([budget()]),
    createBudget: jest.fn().mockResolvedValue(budget()),
    updateBudget: jest.fn().mockResolvedValue(budget({ limit: 2000 })),
    deleteBudget: jest.fn(),
    copyPreviousBudgets: jest.fn().mockResolvedValue([budget()]),
  };
  const users = {
    getById: jest.fn().mockResolvedValue({ baseCurrency: "ARS" }),
  };
  const resolver = {
    resolveCategoryId: jest
      .fn()
      .mockResolvedValue("00000000-0000-4000-8000-000000000003"),
    resolveBudgetId: jest.fn().mockResolvedValue("b1"),
  };
  const tools = new BudgetTools(budgets as any, users as any, resolver as any);
  const byName = (name: string) =>
    tools.definitions().find((definition) => definition.name === name)!;
  return { byName, budgets, resolver };
};

describe("BudgetTools", () => {
  it("lists budgets with and without a period", async () => {
    const { byName, budgets } = build();
    await byName("listBudgets").execute!("u1", {});
    await byName("listBudgets").execute!("u1", { period: "2026-03" });
    expect(budgets.listBudgets).toHaveBeenCalledWith("u1", undefined);
    expect(budgets.listBudgets).toHaveBeenCalledWith("u1", "2026-03");
  });

  it("creates a budget defaulting the currency and resolving the category", async () => {
    const { byName, budgets, resolver } = build();
    const definition = byName("createBudget");

    const prepared = await definition.prepare!("u1", {
      category: "Comida",
      period: "2026-03",
      limit: 1000,
    });
    expect(resolver.resolveCategoryId).toHaveBeenCalledWith("u1", "Comida");
    expect(prepared.args).toMatchObject({ currency: "ARS" });

    await definition.execute!("u1", prepared.args);
    expect(budgets.createBudget).toHaveBeenCalled();
  });

  it("updates a budget and rejects empty changes", async () => {
    const { byName, budgets } = build();
    const definition = byName("updateBudget");
    await definition.prepare!("u1", { budgetId: "b1", limit: 2000 });
    await expect(
      definition.prepare!("u1", { budgetId: "b1" }),
    ).rejects.toMatchObject({
      response: { code: "VALIDATION_ERROR" },
    });
    await definition.execute!("u1", { budgetId: "b1", limit: 2000 });
    expect(budgets.updateBudget).toHaveBeenCalled();
  });

  it("deletes a budget", async () => {
    const { byName, budgets } = build();
    await byName("deleteBudget").prepare!("u1", { budgetId: "b1" });
    await byName("deleteBudget").execute!("u1", { budgetId: "b1" });
    expect(budgets.deleteBudget).toHaveBeenCalledWith("u1", "b1");
  });

  it("copies budgets from a source period", async () => {
    const { byName, budgets } = build();
    const definition = byName("copyPreviousBudgets");
    const prepared = await definition.prepare!("u1", {
      period: "2026-03",
      sourcePeriod: "2026-02",
    });
    expect(prepared.args).toMatchObject({
      period: "2026-03",
      sourcePeriod: "2026-02",
    });

    const result = await definition.execute!("u1", prepared.args);
    expect(budgets.copyPreviousBudgets).toHaveBeenCalled();
    expect(result.summary).toContain("1");

    budgets.copyPreviousBudgets.mockResolvedValue([]);
    expect(
      (await definition.execute!("u1", { period: "2026-03" })).summary,
    ).toContain("No había");
  });

  it("copies without a source period and updates with a period", async () => {
    const { byName } = build();
    const prepared = await byName("copyPreviousBudgets").prepare!("u1", {
      period: "2026-03",
    });
    expect(prepared.args.sourcePeriod).toBeUndefined();
    expect(
      (
        await byName("updateBudget").prepare!("u1", {
          budgetId: "b1",
          limit: 5,
          period: "2026-03",
        })
      ).args,
    ).toBeDefined();
  });
});
