import { StatTiles, type StatTile } from "@/components/common/stat-tiles";
import {
  buildPeriodSummaryStats,
  type PeriodStatKey,
} from "@/lib/period-stats";

export interface ReportsSummaryProps {
  income: number;
  expenses: number;
  savings: number;
  incomeDeltaPct: number | null;
  expensesDeltaPct: number | null;
  savingsDeltaPct: number | null;
  savingsRateDeltaPp: number | null;
  currency: string;
}

const deltaForKey = (
  key: PeriodStatKey,
  props: Pick<
    ReportsSummaryProps,
    | "incomeDeltaPct"
    | "expensesDeltaPct"
    | "savingsDeltaPct"
    | "savingsRateDeltaPp"
  >,
): number | null => {
  if (key === "income") return props.incomeDeltaPct;
  if (key === "expenses") return props.expensesDeltaPct;
  if (key === "savings") return props.savingsDeltaPct;
  return props.savingsRateDeltaPp;
};

export const ReportsSummary = (props: ReportsSummaryProps) => {
  const { income, expenses, savings, currency } = props;

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
    deltaPct: deltaForKey(stat.key, props),
    deltaUnit: stat.key === "savingsRate" ? "points" : "percent",
  }));

  return <StatTiles stats={stats} />;
};
