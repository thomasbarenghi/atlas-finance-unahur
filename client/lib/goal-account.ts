import type { Account, GoalStatus } from "@/lib/api/types";
import { toIsoDate } from "@/lib/format";

export interface GoalAccountProgress {
  saved: number;
  target: number;
  progressPct: number;
  status: GoalStatus;
}

export const goalAccountProgress = (account: Account): GoalAccountProgress => {
  const target = account.targetAmount ?? 0;
  const saved = account.initialBalance;
  const progressPct = target > 0 ? Math.min(100, (saved / target) * 100) : 0;
  const overdue =
    account.targetDate !== null &&
    saved < target &&
    account.targetDate < toIsoDate(new Date());
  const status: GoalStatus =
    target > 0 && saved >= target
      ? "achieved"
      : overdue
        ? "overdue"
        : saved > 0
          ? "in_progress"
          : "pending";
  return { saved, target, progressPct, status };
};
