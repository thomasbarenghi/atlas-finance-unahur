import { formatCurrency, formatPercent } from "@/lib/format";

type PeriodStatKey = "income" | "expenses" | "savings" | "savingsRate";

export interface PeriodSummaryStat {
  key: PeriodStatKey;
  label: string;
  display: string;
  tone: string;
  favorable: "up" | "down";
  hint?: string;
  info?: {
    formula: string;
    description: string;
  };
}

export const buildPeriodSummaryStats = (
  income: number,
  expenses: number,
  savings: number,
  currency: string,
): PeriodSummaryStat[] => {
  const incomeDisplay = formatCurrency(income, currency);
  const expensesDisplay = formatCurrency(expenses, currency);
  const savingsDisplay = formatCurrency(savings, currency);
  const savingsRateDisplay = formatPercent(income > 0 ? savings / income : 0);

  return [
    {
      key: "income",
      label: "Ingresos",
      display: incomeDisplay,
      tone: "text-income",
      favorable: "up",
    },
    {
      key: "expenses",
      label: "Gastos",
      display: expensesDisplay,
      tone: "text-expense",
      favorable: "down",
    },
    {
      key: "savings",
      label: "Ahorro",
      display: savingsDisplay,
      tone: "text-foreground",
      favorable: "up",
      hint: "Ingresos menos gastos; las transferencias entre cuentas no cuentan.",
      info: {
        formula: "Ingresos − gastos",
        description: `Ingresos ${incomeDisplay} − gastos ${expensesDisplay} = ${savingsDisplay}. Es flujo de fondos, no el saldo de tus cuentas.`,
      },
    },
    {
      key: "savingsRate",
      label: "Tasa de ahorro",
      display: savingsRateDisplay,
      tone: "text-foreground",
      favorable: "up",
      info: {
        formula: "Ahorro ÷ ingresos × 100",
        description: `Con ${incomeDisplay} de ingresos y ${expensesDisplay} de gastos, da ${savingsRateDisplay}. Es flujo de fondos, no el saldo de tus cuentas.`,
      },
    },
  ];
};
