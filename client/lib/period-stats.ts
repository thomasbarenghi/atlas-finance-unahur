import { formatCurrency, formatPercent } from "@/lib/format";

export type PeriodStatKey = "income" | "expenses" | "savings" | "savingsRate";

export interface PeriodSummaryStat {
  key: PeriodStatKey;
  label: string;
  display: string;
  tone: string;
  favorable: "up" | "down";
  hint?: string;
}

export const buildPeriodSummaryStats = (
  income: number,
  expenses: number,
  savings: number,
  currency: string,
): PeriodSummaryStat[] => [
  {
    key: "income",
    label: "Ingresos",
    display: formatCurrency(income, currency),
    tone: "text-success",
    favorable: "up",
  },
  {
    key: "expenses",
    label: "Gastos",
    display: formatCurrency(expenses, currency),
    tone: "text-destructive",
    favorable: "down",
  },
  {
    key: "savings",
    label: "Ahorro",
    display: formatCurrency(savings, currency),
    tone: "text-foreground",
    favorable: "up",
    hint: "Ingresos menos gastos; las transferencias entre cuentas no cuentan.",
  },
  {
    key: "savingsRate",
    label: "Tasa de ahorro",
    display: formatPercent(income > 0 ? savings / income : 0),
    tone: "text-foreground",
    favorable: "up",
  },
];
