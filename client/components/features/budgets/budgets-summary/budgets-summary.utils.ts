import type { Budget, BudgetStatus } from "@/lib/api/types";

const STATUS_ORDER: Record<BudgetStatus, number> = {
  exceeded: 0,
  warning: 1,
  available: 2,
};

export const sortBudgetsBySeverity = (budgets: Budget[]): Budget[] =>
  [...budgets].sort((first, second) => {
    const byStatus = STATUS_ORDER[first.status] - STATUS_ORDER[second.status];
    return byStatus !== 0 ? byStatus : second.consumedPct - first.consumedPct;
  });
