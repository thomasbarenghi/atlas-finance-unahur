import { StatTiles, type StatTile } from "@/components/common/stat-tiles";
import { buildPeriodSummaryStats } from "@/lib/period-stats";

export interface ReportsSummaryProps {
  income: number;
  expenses: number;
  savings: number;
  incomeDeltaPct: number | null;
  expensesDeltaPct: number | null;
  currency: string;
}

const deltaForKey = (
  key: string,
  incomeDeltaPct: number | null,
  expensesDeltaPct: number | null,
): number | null => {
  if (key === "income") return incomeDeltaPct;
  if (key === "expenses") return expensesDeltaPct;
  return null;
};

export const ReportsSummary = ({
  income,
  expenses,
  savings,
  incomeDeltaPct,
  expensesDeltaPct,
  currency,
}: ReportsSummaryProps) => {
  const stats: StatTile[] = buildPeriodSummaryStats(
    income,
    expenses,
    savings,
    currency,
  ).map((stat) => ({
    label: stat.label,
    value: stat.display,
    tone: stat.tone,
    favorable: stat.favorable,
    deltaPct: deltaForKey(stat.key, incomeDeltaPct, expensesDeltaPct),
  }));

  return <StatTiles stats={stats} />;
};
