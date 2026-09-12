"use client";

import { PiggyBank } from "lucide-react";
import { BudgetProgress } from "@/components/common/budget-progress";
import { EmptyState } from "@/components/common/empty-state";
import { StatusBadge } from "@/components/common/status-badge";
import { Skeleton } from "@/components/ui/skeleton";
import { formatCurrency } from "@/lib/format";
import { useBudgets } from "@/lib/query/budgets";

export interface BudgetUsageProps {
  period: string;
}

export const BudgetUsage = ({ period }: BudgetUsageProps) => {
  const budgetsQuery = useBudgets(period);

  if (budgetsQuery.isLoading) {
    return (
      <div className="flex flex-col gap-4">
        {Array.from({ length: 3 }).map((_, index) => (
          <Skeleton key={index} className="h-14 w-full" />
        ))}
      </div>
    );
  }

  const budgets = budgetsQuery.data ?? [];

  if (budgets.length === 0) {
    return (
      <EmptyState
        icon={PiggyBank}
        title="Sin presupuestos"
        description="Definí un límite por categoría para este mes."
      />
    );
  }

  return (
    <ul className="flex flex-col gap-4">
      {budgets.map((budget) => (
        <li key={budget.id} className="flex flex-col gap-2">
          <div className="flex items-center justify-between gap-2">
            <span className="text-sm font-medium">{budget.category.name}</span>
            <StatusBadge variant="budget" status={budget.status} />
          </div>
          <span className="text-muted-foreground text-xs">
            {formatCurrency(budget.spent, budget.currency)} de{" "}
            {formatCurrency(budget.limit, budget.currency)}
          </span>
          <BudgetProgress
            status={budget.status}
            consumedPct={budget.consumedPct}
            available={budget.available}
            currency={budget.currency}
          />
        </li>
      ))}
    </ul>
  );
};
