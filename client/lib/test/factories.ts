import type { AssistantActionItem } from "@/hooks/use-assistant-chat";
import type {
  Account,
  Asset,
  Budget,
  Category,
  DashboardData,
  Debt,
  Goal,
  Position,
  Quote,
  Transaction,
  User,
  Valuation,
} from "@/lib/api/types";

const createdAt = "2026-01-15T12:00:00.000Z";

export const makeUser = (overrides: Partial<User> = {}): User => ({
  id: "11111111-1111-4111-8111-111111111111",
  name: "Demo",
  email: "demo@atlassfin.app",
  baseCurrency: "ARS",
  theme: "system",
  aiEnabled: true,
  assistantDestructiveEnabled: false,
  createdAt,
  ...overrides,
});

export const makeAccount = (overrides: Partial<Account> = {}): Account => ({
  id: "22222222-2222-4222-8222-222222222222",
  name: "Caja ARS",
  type: "cash",
  currency: "ARS",
  initialBalance: 50_000,
  currentBalance: 50_000,
  archived: false,
  notes: null,
  createdAt,
  updatedAt: createdAt,
  ...overrides,
});

export const makeCategory = (overrides: Partial<Category> = {}): Category => ({
  id: "33333333-3333-4333-8333-333333333333",
  name: "Comida",
  type: "expense",
  color: "#ef4444",
  icon: null,
  archived: false,
  isSystem: false,
  ...overrides,
});

export const makeTransaction = (
  overrides: Partial<Transaction> = {},
): Transaction => ({
  id: "44444444-4444-4444-8444-444444444444",
  type: "expense",
  amount: 1_000,
  currency: "ARS",
  date: "2026-01-15",
  description: "Supermercado",
  notes: null,
  accountId: makeAccount().id,
  transferAccountId: null,
  categoryId: makeCategory().id,
  transferGroupId: null,
  createdAt,
  updatedAt: createdAt,
  ...overrides,
});

export const makeBudget = (overrides: Partial<Budget> = {}): Budget => ({
  id: "55555555-5555-4555-8555-555555555555",
  categoryId: makeCategory().id,
  category: { id: makeCategory().id, name: "Comida", color: "#ef4444" },
  period: "2026-01-01",
  limit: 150_000,
  currency: "ARS",
  recurring: false,
  spent: 0,
  available: 150_000,
  consumedPct: 0,
  status: "available",
  ...overrides,
});

export const makeGoal = (overrides: Partial<Goal> = {}): Goal => ({
  id: "66666666-6666-4666-8666-666666666666",
  name: "Vacaciones",
  targetAmount: 500_000,
  savedAmount: 120_000,
  currency: "ARS",
  targetDate: "2026-07-01",
  sourceAccountId: null,
  archived: false,
  progressPct: 24,
  status: "in_progress",
  createdAt,
  updatedAt: createdAt,
  ...overrides,
});

export const makeAsset = (overrides: Partial<Asset> = {}): Asset => ({
  id: "77777777-7777-4777-8777-777777777777",
  name: "Departamento",
  type: "property",
  currency: "ARS",
  currentValue: 85_000_000,
  valuationDate: "2026-01-01",
  archived: false,
  notes: null,
  debtId: null,
  createdAt,
  updatedAt: createdAt,
  ...overrides,
});

export const makeValuation = (
  overrides: Partial<Valuation> = {},
): Valuation => ({
  id: "88888888-8888-4888-8888-888888888888",
  assetId: makeAsset().id,
  value: 85_000_000,
  currency: "ARS",
  date: "2026-01-01",
  source: "manual",
  createdAt,
  ...overrides,
});

export const makeDebt = (overrides: Partial<Debt> = {}): Debt => ({
  id: "99999999-9999-4999-8999-999999999999",
  name: "Hipoteca",
  type: "mortgage",
  balance: 45_000_000,
  currency: "ARS",
  date: "2026-01-01",
  archived: false,
  assetId: null,
  createdAt,
  updatedAt: createdAt,
  ...overrides,
});

export const makePosition = (overrides: Partial<Position> = {}): Position => ({
  id: "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa",
  symbol: "BTC",
  instrument: "Bitcoin",
  quantity: 0.05,
  avgCost: 55_000,
  currency: "USD",
  currentPrice: 64_000,
  currentValue: 3_200,
  costBasis: 2_750,
  profitLoss: 450,
  profitLossPct: 16.36,
  quoteDate: createdAt,
  quoteProvider: "coingecko",
  isStale: false,
  archived: false,
  ...overrides,
});

export const makeQuote = (overrides: Partial<Quote> = {}): Quote => ({
  symbol: "BTC",
  price: 64_000,
  currency: "USD",
  provider: "coingecko",
  change24h: 1.8,
  fetchedAt: createdAt,
  isStale: false,
  ...overrides,
});

export const makeAssistantAction = (
  overrides: Partial<AssistantActionItem> = {},
): AssistantActionItem => ({
  actionId: "action-1",
  token: "token-1",
  name: "create_transaction",
  title: "Crear movimiento",
  classification: "write_safe",
  destructive: false,
  summary: "Gasto de 100",
  preview: {
    title: "Crear movimiento",
    summary: "Gasto de 100",
    fields: [{ label: "Monto", value: "100 ARS" }],
    impact: "Afecta tu presupuesto de Comida",
  },
  expiresAt: "2026-01-01T00:10:00.000Z",
  planId: null,
  step: 0,
  pending: false,
  status: "proposed",
  ...overrides,
});

export const makeDashboardData = (
  overrides: Partial<DashboardData> = {},
): DashboardData => ({
  period: { from: "2026-01-01", to: "2026-01-31" },
  currency: "ARS",
  kpis: {
    netWorth: 120_000,
    netWorthDeltaPct: 4.2,
    income: 200_000,
    incomeDeltaPct: 10,
    expenses: 80_000,
    expensesDeltaPct: -5,
    savings: 120_000,
    savingsDeltaPct: 20,
    savingsRateDeltaPp: 3,
    assets: 90_000,
    assetsDeltaPct: 2,
    debts: 10_000,
    debtsDeltaPct: -1,
    accounts: 40_000,
    accountsDeltaPct: 1,
    investmentsDeltaPct: 6,
  },
  netWorthSeries: [
    { date: "2026-01-01", value: 100_000, assets: 110_000, debts: 10_000 },
    { date: "2026-01-31", value: 120_000, assets: 130_000, debts: 10_000 },
  ],
  assetsValueByMonth: [{ month: "2026-01", value: 130_000 }],
  incomeExpenseByMonth: [
    { month: "2026-01", income: 200_000, expenses: 80_000 },
  ],
  expensesByCategory: [
    { categoryId: "cat-1", name: "Comida", color: "#ef4444", value: 50_000 },
  ],
  categoryChanges: [
    {
      categoryId: "cat-1",
      name: "Comida",
      current: 50_000,
      previous: 40_000,
      deltaPct: 25,
    },
  ],
  assetsComposition: [{ type: "property", value: 130_000 }],
  netWorthComposition: [
    { kind: "property", label: "Propiedades", value: 130_000 },
  ],
  cashflow: {
    income: [{ name: "Sueldo", value: 200_000 }],
    expenses: [{ name: "Comida", color: "#ef4444", value: 80_000 }],
    savings: 120_000,
  },
  investments: {
    totalValue: 3_200,
    totalCost: 2_750,
    profitLoss: 450,
    profitLossPct: 16.36,
    staleQuotes: 1,
    positions: [
      {
        id: "position-1",
        symbol: "BTC",
        instrument: "Bitcoin",
        quantity: 0.05,
        originalCurrency: "USD",
        originalValue: 3_200,
        originalCost: 2_750,
        originalProfitLoss: 450,
        value: 3_200,
        profitLossPct: 16.36,
        isStale: true,
        quoteDate: createdAt,
        quoteProvider: "coingecko",
      },
    ],
  },
  budgetAlerts: [
    {
      budgetId: "b-1",
      categoryName: "Comida",
      consumedPct: 92,
      status: "warning",
    },
  ],
  ...overrides,
});
