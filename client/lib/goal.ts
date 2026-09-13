import type { Goal, GoalStatus } from "@/lib/api/types";

export interface GoalProgress {
  saved: number;
  target: number;
  remaining: number;
  progressPct: number;
  status: GoalStatus;
  targetDate: string | null;
  monthlySaving: number | null;
}

export const goalProgress = (
  goal: Goal,
  reference: Date = new Date(),
): GoalProgress => {
  const { savedAmount, targetAmount, targetDate, progressPct, status } = goal;
  const monthlySaving = ((): number | null => {
    if (savedAmount >= targetAmount || targetAmount <= 0 || !targetDate) {
      return null;
    }
    const deadline = new Date(`${targetDate}T00:00:00`);
    if (Number.isNaN(deadline.getTime()) || deadline <= reference) return null;
    const months = Math.max(
      1,
      Math.ceil(
        (deadline.getTime() - reference.getTime()) / (30 * 24 * 3_600_000),
      ),
    );
    return (targetAmount - savedAmount) / months;
  })();

  return {
    saved: savedAmount,
    target: targetAmount,
    remaining: Math.max(0, targetAmount - savedAmount),
    progressPct,
    status,
    targetDate,
    monthlySaving,
  };
};
