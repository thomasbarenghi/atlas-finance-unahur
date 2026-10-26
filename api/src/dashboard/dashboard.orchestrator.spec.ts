import { CalculationsService } from "../shared/calculations/calculations.service";
import { DashboardOrchestrator } from "./dashboard.orchestrator";

const calculations = new CalculationsService();

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
      .mockResolvedValue([{ id: "a1", initialBalance: 1000, currency: "ARS" }]),
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
  const currenciesService = {
    getRateContext: jest.fn().mockResolvedValue({
      primaryCurrency: "ARS",
      rates: new Map([
        ["ARS", 1],
        ["USD", 1180],
      ]),
      rateDate: "2026-03-31",
      rateDates: new Map([["USD", "2026-03-31"]]),
    }),
  };

  const orchestrator = new DashboardOrchestrator(
    accountsService as any,
    transactionsService as any,
    categoriesService as any,
    calculations,
    currenciesService as any,
  );
  return {
    orchestrator,
    accountsService,
    transactionsService,
    categoriesService,
    currenciesService,
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
    expect(data.incomeExpenseByPeriod).toHaveLength(3);
    expect(
      data.incomeExpenseByPeriod.every((item) => item.bucket === "month"),
    ).toBe(true);
    expect(data.netWorthSeries).toHaveLength(3);
    expect(data.period).toEqual(RANGE);
    expect(data.currency).toBe("ARS");
    expect(data.primaryCurrency).toBe("ARS");
    expect(data.breakdown).toEqual([
      expect.objectContaining({ currency: "ARS", balance: 1200 }),
    ]);
  });

  it("uses daily evolution and weekly bars for a month range", async () => {
    const { orchestrator } = build();
    const data = await orchestrator.getDashboard("u1", {
      from: "2026-03-01",
      to: "2026-03-25",
    });

    expect(data.netWorthSeries).toHaveLength(25);
    expect(data.netWorthSeries.at(-1)?.date).toBe("2026-03-25");
    expect(data.incomeExpenseByPeriod).toHaveLength(4);
    expect(data.incomeExpenseByPeriod[0]).toMatchObject({
      bucket: "week",
      start: "2026-03-01",
      end: "2026-03-07",
      income: 500,
    });
    expect(data.incomeExpenseByMonth).toHaveLength(1);
  });

  it("defaults the period and derives the net worth from account balances", async () => {
    const { orchestrator, accountsService } = build();
    accountsService.listOwnedAccounts.mockResolvedValue([
      { id: "a1", initialBalance: 1000, currency: "ARS" },
      { id: "a2", initialBalance: 250, currency: "ARS" },
    ]);

    const data = await orchestrator.getDashboard("u1", {});
    expect(data.currency).toBe("ARS");
    expect(data.period.to).toBeDefined();
    expect(data.period.from < data.period.to).toBe(true);
    expect(data.kpis.netWorth).toBe(1450);
  });

  it("converts every flow to the display currency and keeps net worth in the primary", async () => {
    const { orchestrator, accountsService, transactionsService } = build();
    accountsService.listOwnedAccounts.mockResolvedValue([
      { id: "a1", initialBalance: 1000, currency: "ARS" },
      { id: "a2", initialBalance: 10, currency: "USD" },
    ]);
    transactionsService.listOwnedTransactions.mockResolvedValue([
      transaction({ id: "t1", type: "income", amount: 500, accountId: "a1" }),
      transaction({
        id: "t2",
        type: "income",
        amount: 20,
        date: "2026-03-06",
        accountId: "a2",
      }),
    ]);

    const data = await orchestrator.getDashboard("u1", RANGE);
    expect(data.kpis.netWorth).toBe(1500 + 30 * 1180);
    expect(data.kpis.income).toBe(500 + 20 * 1180);
    expect(data.breakdown).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ currency: "USD", balance: 30 }),
      ]),
    );

    const dollar = await orchestrator.getDashboard("u1", {
      ...RANGE,
      currency: "USD",
    });
    expect(dollar.currency).toBe("USD");
    expect(dollar.kpis.income).toBeCloseTo(500 / 1180 + 20, 6);
    expect(dollar.kpis.netWorth).toBeCloseTo(1500 / 1180 + 30, 6);
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
