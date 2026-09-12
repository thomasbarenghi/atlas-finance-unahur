import type { BudgetStatus, GoalStatus } from "@/lib/api/types";

export type StatusBadgeProps =
  | { variant: "budget"; status: BudgetStatus }
  | { variant: "goal"; status: GoalStatus }
  | { variant: "account"; archived: boolean }
  | { variant: "quote"; isStale: boolean };
