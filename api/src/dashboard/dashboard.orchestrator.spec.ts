import { ConfigService } from "@nestjs/config";
import { AppConfig } from "../config/configuration";
import { CalculationsService } from "../shared/calculations/calculations.service";
import { DashboardOrchestrator } from "./dashboard.orchestrator";

const calculations = new CalculationsService();

const config = {
  get: jest.fn((key: string) =>
    key === "defaultCurrency" ? "ARS" : undefined,
  ),
} as unknown as ConfigService<AppConfig, true>;

const transaction = (overrides: Record<string, unknown> = {}) => ({
  id: "t1",
  type: "income",
  amount: 500,
  date: "2026-03-05",
  categoryId: "c-income",
  accountId: "a1",
  transferAccountId: null,
  ...overrides,
});

const build = () => {
  const accountsService = {
    listOwnedAccounts: jest
      .fn()
      .mockResolvedValue([{ id: "a1", initialBalance: 1000 }]),
  };
  const transactionsService = {
    listOwnedTransactions: jest.fn().mockResolvedValue([
      transaction(),
      transaction({
        id: "t2",
        type: "expense",
        amount: 200,
        date: "2026-03-10",
        categoryId: "c-expense",
      }),
      transaction({
        id: "t3",
        type: "transfer",
        amount: -100,
        date: "2026-03-15",
        categoryId: null,
        transferAccountId: "a2",
      }),
    ]),
  };
  const categoriesService = {
    listCategories: jest.fn().mockResolvedValue([
      { id: "c-income", name: "Sueldo", color: "#22c55e" },
      { id: "c-expense", name: "Comida", color: "#ef4444" },
    ]),
  };

  const orchestrator = new DashboardOrchestrator(
    accountsService as any,
    transactionsService as any,
    categoriesService as any,
    calculations,
    config,
  );
  return {
    orchestrator,
    accountsService,
    transactionsService,
    categoriesService,
  };
};

const RANGE = { from: "2026-01-01", to: "2026-03-31" };

describe("DashboardOrchestrator", () => {
  it("aggregates KPIs, series and expenses by category for the period", async () => {
    const { orchestrator } = build();
    const data = await orchestrator.getDashboard("u1", RANGE);

    expect(data.kpis).toMatchObject({
      income: 500,
      expenses: 200,
      savings: 300,
      netWorth: 1200,
    });
    expect(data.expensesByCategory).toEqual([
      expect.objectContaining({ name: "Comida", value: 200 }),
    ]);
    expect(data.incomeExpenseByMonth).toHaveLength(3);
    expect(data.netWorthSeries).toHaveLength(3);
    expect(data.period).toEqual(RANGE);
    expect(data.currency).toBe("ARS");
  });

  it("defaults the period and derives the net worth from account balances", async () => {
    const { orchestrator, accountsService } = build();
    accountsService.listOwnedAccounts.mockResolvedValue([
      { id: "a1", initialBalance: 1000 },
      { id: "a2", initialBalance: 250 },
    ]);

    const data = await orchestrator.getDashboard("u1", {});
    expect(data.currency).toBe("ARS");
    expect(data.period.to).toBeDefined();
    expect(data.period.from < data.period.to).toBe(true);
    expect(data.kpis.netWorth).toBe(1450);
  });

  it("excludes transfers from the consolidated income and expenses", async () => {
    const { orchestrator, transactionsService } = build();
    transactionsService.listOwnedTransactions.mockResolvedValue([
      transaction({ id: "t1", type: "transfer", amount: 900 }),
      transaction({ id: "t2", type: "transfer", amount: -900 }),
    ]);

    const data = await orchestrator.getDashboard("u1", RANGE);
    expect(data.kpis.income).toBe(0);
    expect(data.kpis.expenses).toBe(0);
  });

  it("counts uncategorized expenses and drives deltas from the previous period", async () => {
    const { orchestrator, transactionsService } = build();
    transactionsService.listOwnedTransactions.mockResolvedValue([
      transaction({
        id: "t1",
        type: "expense",
        amount: 100,
        date: "2026-03-05",
        categoryId: null,
      }),
      transaction({
        id: "t0",
        type: "income",
        amount: 40,
        date: "2025-12-05",
        categoryId: "c-income",
      }),
    ]);

    const data = await orchestrator.getDashboard("u1", RANGE);
    expect(data.kpis.expenses).toBe(100);
    expect(data.expensesByCategory).toEqual([]);
    expect(data.kpis.incomeDeltaPct).not.toBeNull();
  });
});
