import { StatTiles, type StatTile } from "@/components/common/stat-tiles";
import type { Budget } from "@/lib/api/types";
import { formatCurrency } from "@/lib/format";

export interface BudgetsSummaryProps {
  budgets: Budget[];
}

export { sortBudgetsBySeverity } from "./budgets-summary.utils";

export const BudgetsSummary = ({ budgets }: BudgetsSummaryProps) => {
  if (budgets.length === 0) return null;

  const currency = budgets[0].currency;
  const totalLimit = budgets.reduce((sum, budget) => sum + budget.limit, 0);
  const totalSpent = budgets.reduce((sum, budget) => sum + budget.spent, 0);
  const totalAvailable = totalLimit - totalSpent;
  const exceededCount = budgets.filter(
    (budget) => budget.status === "exceeded",
  ).length;

  const stats: StatTile[] = [
    {
      label: "Presupuesto total",
      value: formatCurrency(totalLimit, currency),
    },
    { label: "Gastado", value: formatCurrency(totalSpent, currency) },
    {
      label: "Disponible",
      value: formatCurrency(totalAvailable, currency),
      tone: totalAvailable < 0 ? "text-destructive" : "text-foreground",
    },
    {
      label: "Categorías excedidas",
      value: String(exceededCount),
      tone: exceededCount > 0 ? "text-destructive" : "text-foreground",
    },
  ];

  return <StatTiles stats={stats} />;
};
