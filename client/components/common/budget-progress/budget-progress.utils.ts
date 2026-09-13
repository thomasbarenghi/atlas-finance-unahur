import type { BudgetStatus } from "@/lib/api/types";

export const budgetIndicatorClass = (status: BudgetStatus): string => {
  if (status === "exceeded") {
    return "[&>[data-slot=progress-indicator]]:bg-destructive";
  }
  if (status === "warning") {
    return "[&>[data-slot=progress-indicator]]:bg-warning";
  }
  return "[&>[data-slot=progress-indicator]]:bg-success";
};
