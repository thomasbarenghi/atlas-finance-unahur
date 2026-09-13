import { AssetType, BudgetStatus } from "../../common/types/financial-enums";

export type NetWorthCompositionKind =
  "property" | "vehicle" | "asset" | "investment" | "cash" | "account";

export interface DashboardInvestmentPosition {
  symbol: string;
  instrument: string;
  quantity: number;
  originalCurrency: string;
  originalValue: number;
  originalCost: number;
  originalProfitLoss: number | null;
  value: number;
  profitLossPct: number | null;
  isStale: boolean;
  quoteDate: string | null;
}

export interface DashboardData {
  period: { from: string; to: string };
  currency: string;
  kpis: {
    netWorth: number;
    netWorthDeltaPct: number | null;
    income: number;
    incomeDeltaPct: number | null;
    expenses: number;
    expensesDeltaPct: number | null;
    savings: number;
    savingsDeltaPct: number | null;
    savingsRateDeltaPp: number | null;
    assets: number;
    assetsDeltaPct: number | null;
    debts: number;
    debtsDeltaPct: number | null;
    accounts: number;
    accountsDeltaPct: number | null;
    investmentsDeltaPct: number | null;
  };
  netWorthSeries: {
    date: string;
    value: number;
    assets: number;
    debts: number;
  }[];
  assetsValueByMonth: { month: string; value: number }[];
  incomeExpenseByMonth: {
    month: string;
    income: number;
    expenses: number;
  }[];
  expensesByCategory: {
    categoryId: string;
    name: string;
    color: string;
    value: number;
  }[];
  categoryChanges: {
    categoryId: string;
    name: string;
    current: number;
    previous: number;
    deltaPct: number | null;
  }[];
  assetsComposition: { type: AssetType; value: number }[];
  netWorthComposition: {
    kind: NetWorthCompositionKind;
    label: string;
    value: number;
  }[];
  cashflow: {
    income: { name: string; value: number }[];
    expenses: { name: string; color: string; value: number }[];
    savings: number;
  };
  investments: {
    totalValue: number;
    totalCost: number;
    profitLoss: number;
    profitLossPct: number;
    staleQuotes: number;
    positions: DashboardInvestmentPosition[];
  };
  budgetAlerts: {
    budgetId: string;
    categoryName: string;
    consumedPct: number;
    status: BudgetStatus;
  }[];
}
