import { BudgetStatus } from "../../common/types/financial-enums";

export class ReportSummary {
  from: string;
  to: string;
  currency: string;
  income: number;
  expenses: number;
  savings: number;
  netWorth: number;
}

export class ReportByCategoryRow {
  categoryId: string;
  name: string;
  type: "income" | "expense";
  value: number;
  pct: number;
}

export class NetWorthPoint {
  date: string;
  netWorth: number;
}

export class BudgetReportRow {
  budgetId: string;
  categoryName: string;
  limit: number;
  spent: number;
  consumedPct: number;
  status: BudgetStatus;
}
