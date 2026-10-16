export class DashboardData {
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
  };
  netWorthSeries: { date: string; value: number }[];
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
