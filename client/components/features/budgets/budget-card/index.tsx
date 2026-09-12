"use client";

import { Pencil, Trash2 } from "lucide-react";
import { CategoryBadge } from "@/components/common/category-badge";
import { RowActionsMenu } from "@/components/common/row-actions-menu";
import { StatusBadge } from "@/components/common/status-badge";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import type { Budget } from "@/lib/api/types";
import { formatCurrency, formatPercent } from "@/lib/format";

export interface BudgetCardProps {
  budget: Budget;
  onEdit: (budget: Budget) => void;
  onDelete: (budget: Budget) => void;
}

export const BudgetCard = ({ budget, onEdit, onDelete }: BudgetCardProps) => {
  return (
    <Card className="flex flex-col">
      <CardHeader className="gap-3">
        <div className="flex items-start justify-between gap-2">
          <CategoryBadge category={budget.category} />
          <div className="flex items-center gap-2">
            <StatusBadge variant="budget" status={budget.status} />
            <RowActionsMenu
              label={budget.category.name}
              actions={[
                {
                  label: "Editar",
                  icon: Pencil,
                  onSelect: () => onEdit(budget),
                },
                {
                  label: "Eliminar",
                  icon: Trash2,
                  variant: "destructive",
                  onSelect: () => onDelete(budget),
                },
              ]}
            />
          </div>
        </div>
      </CardHeader>
      <CardContent className="flex flex-1 flex-col gap-4">
        <div className="flex items-baseline justify-between gap-2">
          <span className="font-heading text-xl font-semibold tabular-nums">
            {formatCurrency(budget.spent, budget.currency)}
          </span>
          <span className="text-muted-foreground text-sm">
            de {formatCurrency(budget.limit, budget.currency)}
          </span>
        </div>
        <Progress value={Math.min(budget.consumedPct, 100)} />
        <div className="grid grid-cols-3 gap-2 text-sm">
          <div className="flex flex-col">
            <span className="text-muted-foreground text-xs">Disponible</span>
            <span className="tabular-nums">
              {formatCurrency(budget.available, budget.currency)}
            </span>
          </div>
          <div className="flex flex-col">
            <span className="text-muted-foreground text-xs">Consumido</span>
            <span className="tabular-nums">
              {formatPercent(budget.consumedPct / 100)}
            </span>
          </div>
          <div className="flex flex-col">
            <span className="text-muted-foreground text-xs">Período</span>
            <span>{budget.period.slice(0, 7)}</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
