export interface DashboardBreakdown {
  currency: string;
  balance: number;
  accounts: number;
  /** Equivalent in the dashboard display currency. */
  converted: number;
}

export interface DashboardRate {
  currency: string;
  /** How many units of the display currency one unit buys. */
  rate: number;
  rateDate: string;
}

export class DashboardData {
  period: { from: string; to: string };
  /** Currency scope of the period indicators and charts. */
  currency: string;
  /** User's primary currency. */
  primaryCurrency: string;
  rateDate: string | null;
  availableCurrencies: string[];
  breakdown: DashboardBreakdown[];
  rates: DashboardRate[];
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
  };
  netWorthSeries: { date: string; value: number }[];
  incomeExpenseByPeriod: {
    bucket: "week" | "month";
    start: string;
    end: string;
    income: number;
    expenses: number;
  }[];
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
}
