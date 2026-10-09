import { ConfigService } from "@nestjs/config";
import { AppConfig } from "../config/configuration";
import { CalculationsService } from "../shared/calculations/calculations.service";
import { DashboardOrchestrator } from "./dashboard.orchestrator";

const calculations = new CalculationsService({
  get: jest.fn(() => 0.8),
} as unknown as ConfigService<AppConfig, true>);

const transaction = (overrides: Record<string, unknown> = {}) => ({
  id: "t1",
  type: "income",
  amount: 500,
  currency: "ARS",
  date: "2026-03-05",
  categoryId: "c-income",
  accountId: "a1",
  transferAccountId: null,
  ...overrides,
});

const build = () => {
  const usersService = {
    getById: jest.fn().mockResolvedValue({ baseCurrency: "ARS" }),
  };
  const accountsService = {
    listOwnedAccounts: jest
      .fn()
      .mockResolvedValue([
        { id: "a1", initialBalance: 1000, currency: "ARS", archived: false },
      ]),
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
  const assetsService = {
    listOwnedAssets: jest
      .fn()
      .mockResolvedValue([
        { id: "asset-1", type: "property", currency: "ARS", archived: false },
      ]),
    listValuationsForUser: jest.fn().mockResolvedValue([
      {
        assetId: "asset-1",
        value: 90000,
        currency: "ARS",
        date: "2026-03-01",
      },
    ]),
  };
  const debtsService = {
    listOwnedDebts: jest
      .fn()
      .mockResolvedValue([
        { id: "d1", balance: 5000, currency: "ARS", archived: false },
      ]),
  };
  const positionsService = {
    listOwnedPositions: jest.fn().mockResolvedValue([
      {
        id: "p1",
        symbol: "BTC",
        instrument: "Bitcoin",
        quantity: 2,
        avgCost: 100,
        currency: "USD",
        archived: false,
      },
    ]),
  };
  const quotesService = {
    listLatestQuoteEntities: jest.fn().mockResolvedValue([
      {
        symbol: "BTC",
        currency: "USD",
        price: 150,
        provider: "binance",
        fetchedAt: new Date(),
      },
    ]),
  };
  const budgetsOrchestrator = {
    listBudgetAlerts: jest.fn().mockResolvedValue([]),
  };
  const fxService = {
    getConverter: jest.fn(async () => (amount: number) => amount),
  };
  const config = {
    get: jest.fn(() => ({ quoteStaleMs: 3_600_000 })),
  };

  const orchestrator = new DashboardOrchestrator(
    usersService as any,
    accountsService as any,
    transactionsService as any,
    categoriesService as any,
    assetsService as any,
    debtsService as any,
    positionsService as any,
    quotesService as any,
    budgetsOrchestrator as any,
    calculations,
    fxService as any,
    config as any,
  );
  return {
    orchestrator,
    usersService,
    accountsService,
    transactionsService,
    categoriesService,
    assetsService,
    debtsService,
    positionsService,
    quotesService,
    budgetsOrchestrator,
  };
};

const RANGE = { from: "2026-01-01", to: "2026-03-31" };

describe("DashboardOrchestrator", () => {
  it("aggregates KPIs, series and composition for the period", async () => {
    const { orchestrator } = build();
    const data = await orchestrator.getDashboard("u1", RANGE as any);

    expect(data.kpis).toMatchObject({
      income: 500,
      expenses: 200,
      savings: 300,
      accounts: 1200,
      assets: 90000,
      debts: 5000,
      netWorth: 86500,
    });
    expect(data.kpis.investmentsDeltaPct).toBeCloseTo(50, 1);
    expect(data.expensesByCategory).toEqual([
      expect.objectContaining({ name: "Comida", value: 200 }),
    ]);
    expect(data.incomeExpenseByMonth).toHaveLength(3);
    expect(data.netWorthSeries).toHaveLength(3);
    expect(data.netWorthComposition).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ kind: "property", value: 90000 }),
        expect.objectContaining({ kind: "account", value: 1200 }),
      ]),
    );
    expect(data.investments).toMatchObject({
      totalCost: 200,
      totalValue: 300,
      profitLoss: 100,
      staleQuotes: 0,
    });
    expect(data.period).toEqual(RANGE);
    expect(data.currency).toBe("ARS");
  });

  it("defaults the period and uses the base currency", async () => {
    const { orchestrator } = build();
    const data = await orchestrator.getDashboard("u1", {} as any);
    expect(data.currency).toBe("ARS");
    expect(data.period.to).toBeDefined();
    expect(data.period.from < data.period.to).toBe(true);
  });

  it("derives budget alerts from the budgets orchestrator", async () => {
    const { orchestrator, budgetsOrchestrator } = build();
    budgetsOrchestrator.listBudgetAlerts.mockResolvedValue([
      {
        id: "b1",
        category: { name: "Comida" },
        consumedPct: 90,
        status: "warning",
      },
    ]);
    const data = await orchestrator.getDashboard("u1", RANGE as any);
    expect(data.budgetAlerts).toEqual([
      {
        budgetId: "b1",
        categoryName: "Comida",
        consumedPct: 90,
        status: "warning",
      },
    ]);
  });

  it("handles positions without a quote and stale quotes", async () => {
    const { orchestrator, quotesService } = build();
    quotesService.listLatestQuoteEntities.mockResolvedValue([]);
    const withoutQuote = await orchestrator.getDashboard("u1", RANGE as any);
    expect(withoutQuote.investments.totalValue).toBe(0);
    expect(withoutQuote.investments.positions[0].isStale).toBe(false);

    quotesService.listLatestQuoteEntities.mockResolvedValue([
      {
        symbol: "BTC",
        currency: "USD",
        price: 150,
        provider: "binance",
        fetchedAt: new Date(Date.now() - 2 * 60 * 60 * 1000),
      },
    ]);
    const stale = await orchestrator.getDashboard("u1", RANGE as any);
    expect(stale.investments.staleQuotes).toBe(1);
    expect(stale.investments.positions[0].isStale).toBe(true);
  });

  it("returns zeroed investments with no positions", async () => {
    const { orchestrator, positionsService, quotesService } = build();
    positionsService.listOwnedPositions.mockResolvedValue([]);
    quotesService.listLatestQuoteEntities.mockResolvedValue([]);
    const data = await orchestrator.getDashboard("u1", RANGE as any);
    expect(data.investments.totalValue).toBe(0);
    expect(data.investments.positions).toEqual([]);
    expect(data.investments.staleQuotes).toBe(0);
  });

  it("excludes archived records and handles other asset types and uncategorized income", async () => {
    const {
      orchestrator,
      accountsService,
      transactionsService,
      assetsService,
      debtsService,
      positionsService,
      categoriesService,
    } = build();

    accountsService.listOwnedAccounts.mockResolvedValue([
      { id: "a1", initialBalance: 1000, currency: "ARS", archived: false },
      { id: "a2", initialBalance: 9999, currency: "ARS", archived: true },
    ]);
    transactionsService.listOwnedTransactions.mockResolvedValue([
      transaction({
        id: "t1",
        type: "income",
        amount: 500,
        date: "2026-03-05",
        categoryId: null,
      }),
      transaction({
        id: "t0",
        type: "income",
        amount: 300,
        date: "2025-12-05",
        categoryId: "c-income",
      }),
      transaction({
        id: "t-1",
        type: "expense",
        amount: 100,
        date: "2025-12-10",
        categoryId: "c-expense",
      }),
    ]);
    assetsService.listOwnedAssets.mockResolvedValue([
      { id: "asset-1", type: "cash", currency: "ARS", archived: false },
      { id: "asset-2", type: "vehicle", currency: "ARS", archived: true },
    ]);
    assetsService.listValuationsForUser.mockResolvedValue([
      { assetId: "asset-1", value: 500, currency: "ARS", date: "2026-03-01" },
      { assetId: "asset-2", value: 9999, currency: "ARS", date: "2026-03-01" },
    ]);
    debtsService.listOwnedDebts.mockResolvedValue([
      { id: "d1", balance: 100, currency: "ARS", archived: false },
      { id: "d2", balance: 9999, currency: "ARS", archived: true },
    ]);
    positionsService.listOwnedPositions.mockResolvedValue([
      {
        id: "p1",
        symbol: "BTC",
        instrument: "Bitcoin",
        quantity: 1,
        avgCost: 0,
        currency: "USD",
        archived: true,
      },
    ]);
    categoriesService.listCategories.mockResolvedValue([
      { id: "c-income", name: "Sueldo", color: "#22c55e" },
      { id: "c-expense", name: "Comida", color: "#ef4444" },
    ]);

    const data = await orchestrator.getDashboard("u1", RANGE as any);

    // archived account/asset/debt/position are ignored
    expect(data.kpis.accounts).toBe(1700);
    expect(data.kpis.assets).toBe(500);
    expect(data.kpis.debts).toBe(100);
    expect(data.investments.positions).toEqual([]);
    // "cash" asset is grouped as "Otros activos"
    expect(data.netWorthComposition).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ kind: "asset", value: 500 }),
      ]),
    );
    // uncategorized income is labelled
    expect(data.cashflow.income).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ name: "Otros ingresos" }),
      ]),
    );
    // previous period drives non-null deltas
    expect(data.kpis.incomeDeltaPct).not.toBeNull();
  });

  it("honours a currency override and null investment delta with zero cost", async () => {
    const { orchestrator, usersService, positionsService } = build();
    usersService.getById.mockResolvedValue({ baseCurrency: "USD" });
    positionsService.listOwnedPositions.mockResolvedValue([
      {
        id: "p1",
        symbol: "BTC",
        instrument: "Bitcoin",
        quantity: 1,
        avgCost: 0,
        currency: "USD",
        archived: false,
      },
    ]);
    const data = await orchestrator.getDashboard("u1", {
      from: "2026-01-01",
      to: "2026-03-31",
      currency: "eur",
    } as any);
    expect(data.currency).toBe("EUR");
    expect(data.kpis.investmentsDeltaPct).toBeNull();
  });

  it("groups vehicle assets as their own composition bucket", async () => {
    const { orchestrator, assetsService } = build();
    assetsService.listOwnedAssets.mockResolvedValue([
      { id: "asset-v", type: "vehicle", currency: "ARS", archived: false },
    ]);
    assetsService.listValuationsForUser.mockResolvedValue([
      { assetId: "asset-v", value: 200, currency: "ARS", date: "2026-03-01" },
    ]);
    const data = await orchestrator.getDashboard("u1", RANGE as any);
    expect(data.netWorthComposition).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ kind: "vehicle", value: 200 }),
      ]),
    );
  });
});
