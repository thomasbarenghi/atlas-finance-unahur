import type { Account, GoalStatus } from "@/lib/api/types";
import { toIsoDate } from "@/lib/format";

export interface GoalAccountProgress {
  saved: number;
  target: number;
  progressPct: number;
  status: GoalStatus;
  targetDate: string | null;
  monthlySaving: number | null;
}

export const goalAccountProgress = (
  account: Account,
  reference: Date = new Date(),
): GoalAccountProgress => {
  const target = account.targetAmount ?? 0;
  const saved = account.initialBalance;
  const progressPct = target > 0 ? Math.min(100, (saved / target) * 100) : 0;
  const overdue =
    account.targetDate !== null &&
    saved < target &&
    account.targetDate < toIsoDate(reference);
  const status: GoalStatus =
    target > 0 && saved >= target
      ? "achieved"
      : overdue
        ? "overdue"
        : saved > 0
          ? "in_progress"
          : "pending";

  const monthlySaving = ((): number | null => {
    if (saved >= target || target <= 0 || !account.targetDate) return null;
    const deadline = new Date(`${account.targetDate}T00:00:00`);
    if (Number.isNaN(deadline.getTime()) || deadline <= reference) return null;
    const months = Math.max(
      1,
      Math.ceil(
        (deadline.getTime() - reference.getTime()) / (30 * 24 * 3_600_000),
      ),
    );
    return (target - saved) / months;
  })();

  return {
    saved,
    target,
    progressPct,
    status,
    targetDate: account.targetDate,
    monthlySaving,
  };
};
