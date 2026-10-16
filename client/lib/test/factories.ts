import type {
  Account,
  Category,
  DashboardData,
  Transaction,
  User,
} from "@/lib/api/types";

const createdAt = "2026-01-15T12:00:00.000Z";

export const makeUser = (overrides: Partial<User> = {}): User => ({
  id: "11111111-1111-4111-8111-111111111111",
  name: "Demo",
  email: "demo@atlassfin.app",
  createdAt,
  ...overrides,
});

export const makeAccount = (overrides: Partial<Account> = {}): Account => ({
  id: "22222222-2222-4222-8222-222222222222",
  name: "Caja ARS",
  type: "cash",
  initialBalance: 50_000,
  currentBalance: 50_000,
  notes: null,
  createdAt,
  updatedAt: createdAt,
  ...overrides,
});

export const makeCategory = (overrides: Partial<Category> = {}): Category => ({
  id: "33333333-3333-4333-8333-333333333333",
  name: "Supermercado",
  type: "expense",
  color: "#ef4444",
  icon: null,
  ...overrides,
});

export const makeTransaction = (
  overrides: Partial<Transaction> = {},
): Transaction => ({
  id: "44444444-4444-4444-8444-444444444444",
  type: "expense",
  amount: 1_000,
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
  },
  netWorthSeries: [
    { date: "2026-01-01", value: 100_000 },
    { date: "2026-01-31", value: 120_000 },
  ],
  incomeExpenseByMonth: [
    { month: "2026-01", income: 200_000, expenses: 80_000 },
  ],
  expensesByCategory: [
    {
      categoryId: "cat-1",
      name: "Supermercado",
      color: "#ef4444",
      value: 50_000,
    },
  ],
  ...overrides,
});
