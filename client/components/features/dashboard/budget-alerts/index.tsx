"use client";

import { PiggyBank } from "lucide-react";
import { EmptyState } from "@/components/common/empty-state";
import { StatusBadge } from "@/components/common/status-badge";
import { Progress } from "@/components/ui/progress";
import type { BudgetStatus } from "@/lib/api/types";

export interface BudgetAlertsProps {
  alerts: {
    budgetId: string;
    categoryName: string;
    consumedPct: number;
    status: BudgetStatus;
  }[];
}

export const BudgetAlerts = ({ alerts }: BudgetAlertsProps) => {
  if (alerts.length === 0) {
    return (
      <EmptyState
        icon={PiggyBank}
        title="Tus presupuestos están bajo control"
        description="No hay presupuestos cerca del límite ni excedidos este mes."
      />
    );
  }

  return (
    <ul className="flex flex-col gap-4">
      {alerts.map((alert) => (
        <li key={alert.budgetId} className="flex flex-col gap-2">
          <div className="flex items-center justify-between gap-2">
            <span className="text-sm font-medium">{alert.categoryName}</span>
            <StatusBadge variant="budget" status={alert.status} />
          </div>
          <Progress value={Math.min(alert.consumedPct, 100)} />
          <span className="text-muted-foreground text-xs">
            {Math.round(alert.consumedPct)}% consumido
          </span>
        </li>
      ))}
    </ul>
  );
};
