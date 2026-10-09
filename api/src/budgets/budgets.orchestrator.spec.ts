import { ErrorCode } from "../common/errors/error-codes";
import { BudgetsOrchestrator } from "./budgets.orchestrator";
import { Budget } from "./entities/budget.entity";

const budget = (overrides: Partial<Budget> = {}): Budget =>
  ({
    id: "b1",
    userId: "u1",
    categoryId: "c1",
    period: "2026-03-01",
    limit: 1000,
    currency: "ARS",
    recurring: false,
    ...overrides,
  }) as Budget;

const build = () => {
  const budgetsService = {
    listOwnedBudgets: jest.fn().mockResolvedValue([budget()]),
    projectForMonth: jest.fn((budgets: Budget[]) => budgets),
    createBudget: jest.fn(async (_u: string, dto: any) => budget(dto)),
    updateBudget: jest.fn(async () => budget()),
    deleteBudget: jest.fn(),
    copyPreviousBudgets: jest.fn(async () => [budget()]),
  };
  const categoriesService = {
    listCategories: jest
      .fn()
      .mockResolvedValue([{ id: "c1", name: "Comida", color: "#ef4444" }]),
    assertCategoryUsable: jest.fn(async () => ({ id: "c1", type: "expense" })),
  };
  const transactionsService = {
    expensesByCategoryMonth: jest
      .fn()
      .mockResolvedValue(new Map([["c1:2026-03", 300]])),
  };
  const calculationsService = {
    calculateBudgetConsumption: jest.fn((limit: number, spent: number) => ({
      limit,
      spent,
      available: limit - spent,
      consumedPct: limit > 0 ? (spent / limit) * 100 : 0,
      status: spent > limit ? "exceeded" : "available",
    })),
  };
  const orchestrator = new BudgetsOrchestrator(
    budgetsService as any,
    categoriesService as any,
    transactionsService as any,
    calculationsService as any,
  );
  return {
    orchestrator,
    budgetsService,
    categoriesService,
    transactionsService,
  };
};

describe("BudgetsOrchestrator", () => {
  it("lists budgets deriving consumption and category info", async () => {
    const { orchestrator, budgetsService, transactionsService } = build();
    const [result] = await orchestrator.listBudgets("u1", "2026-03");

    expect(budgetsService.projectForMonth).toHaveBeenCalled();
    expect(transactionsService.expensesByCategoryMonth).toHaveBeenCalledWith(
      "u1",
      ["2026-03"],
      ["c1"],
    );
    expect(result).toMatchObject({
      spent: 300,
      available: 700,
      consumedPct: 30,
      category: { name: "Comida", color: "#ef4444" },
    });
  });

  it("returns alerts only for warning/exceeded budgets", async () => {
    const { orchestrator, budgetsService, transactionsService } = build();
    transactionsService.expensesByCategoryMonth.mockResolvedValue(
      new Map([["c1:2026-03", 1200]]),
    );

    const alerts = await orchestrator.listBudgetAlerts("u1", "2026-03");
    expect(alerts).toHaveLength(1);
    expect(alerts[0].status).toBe("exceeded");

    transactionsService.expensesByCategoryMonth.mockResolvedValue(new Map());
    await expect(
      orchestrator.listBudgetAlerts("u1", "2026-03"),
    ).resolves.toEqual([]);
    void budgetsService;
  });

  it("requires an expense category to create a budget", async () => {
    const { orchestrator, categoriesService, budgetsService } = build();
    await orchestrator.createBudget("u1", { categoryId: "c1" } as any);
    expect(budgetsService.createBudget).toHaveBeenCalled();

    categoriesService.assertCategoryUsable.mockResolvedValue({
      id: "c1",
      type: "income",
    });
    await expect(
      orchestrator.createBudget("u1", { categoryId: "c1" } as any),
    ).rejects.toMatchObject({ response: { code: ErrorCode.VALIDATION_ERROR } });
  });

  it("delegates update, delete and copy-previous", async () => {
    const { orchestrator, budgetsService } = build();
    await orchestrator.updateBudget("u1", "b1", { limit: 1 } as any);
    await orchestrator.deleteBudget("u1", "b1");
    const copies = await orchestrator.copyPreviousBudgets("u1", {
      period: "2026-03",
    } as any);
    expect(budgetsService.updateBudget).toHaveBeenCalled();
    expect(budgetsService.deleteBudget).toHaveBeenCalled();
    expect(copies).toHaveLength(1);
  });

  it("returns an empty derivation for no budgets", async () => {
    const { orchestrator, budgetsService } = build();
    budgetsService.listOwnedBudgets.mockResolvedValue([]);
    await expect(orchestrator.listBudgets("u1")).resolves.toEqual([]);
  });
});
