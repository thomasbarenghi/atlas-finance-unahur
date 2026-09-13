import type { Budget } from "@/lib/api/types";

export interface BudgetPace {
  daysInMonth: number;
  daysElapsed: number;
  daysRemaining: number;
  isCurrentMonth: boolean;
  isPastMonth: boolean;
  dailyAverage: number;
  projectedSpend: number;
  projectedOver: number;
  dailyAllowance: number;
}

export const budgetPace = (
  budget: Pick<Budget, "period" | "spent" | "limit" | "available">,
  reference: Date = new Date(),
): BudgetPace => {
  const [year, month] = budget.period.slice(0, 7).split("-").map(Number);
  const daysInMonth = new Date(year, month, 0).getDate();

  const referenceMonth = reference.getFullYear() * 12 + reference.getMonth();
  const budgetMonth = year * 12 + (month - 1);
  const isCurrentMonth = referenceMonth === budgetMonth;
  const isPastMonth = budgetMonth < referenceMonth;

  const daysElapsed = isCurrentMonth
    ? Math.min(reference.getDate(), daysInMonth)
    : isPastMonth
      ? daysInMonth
      : 0;
  const daysRemaining = isCurrentMonth
    ? Math.max(0, daysInMonth - reference.getDate())
    : isPastMonth
      ? 0
      : daysInMonth;

  const dailyAverage = daysElapsed > 0 ? budget.spent / daysElapsed : 0;
  const projectedSpend = isCurrentMonth
    ? dailyAverage * daysInMonth
    : isPastMonth
      ? budget.spent
      : 0;
  const projectedOver = Math.max(0, projectedSpend - budget.limit);
  const dailyAllowance =
    daysRemaining > 0 ? Math.max(0, budget.available) / daysRemaining : 0;

  return {
    daysInMonth,
    daysElapsed,
    daysRemaining,
    isCurrentMonth,
    isPastMonth,
    dailyAverage,
    projectedSpend,
    projectedOver,
    dailyAllowance,
  };
};
