"use client";

import Link from "next/link";
import { ChevronRight, Repeat } from "lucide-react";
import { BudgetProgress } from "@/components/common/budget-progress";
import { CategoryBadge } from "@/components/common/category-badge";
import { StatusBadge } from "@/components/common/status-badge";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import type { Budget } from "@/lib/api/types";
import { formatCurrency } from "@/lib/format";
import { daysRemainingInMonth } from "@/lib/period";

export interface BudgetCardProps {
  budget: Budget;
}

export const BudgetCard = ({ budget }: BudgetCardProps) => {
  const daysRemaining = daysRemainingInMonth(budget.period);
  const detailHref = `/budgets/detail?id=${budget.id}&period=${budget.period.slice(0, 7)}`;

  return (
    <Link
      href={detailHref}
      aria-label={`Ver detalle del presupuesto de ${budget.category.name}`}
      className="block rounded-3xl focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
    >
      <Card className="hover:bg-muted/40 flex flex-col transition-colors">
        <CardHeader className="gap-3">
          <div className="flex items-start justify-between gap-2">
            <CategoryBadge category={budget.category} />
            <div className="flex items-center gap-2">
              <StatusBadge variant="budget" status={budget.status} />
              <ChevronRight
                className="text-muted-foreground size-4"
                aria-hidden
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

          <BudgetProgress
            status={budget.status}
            consumedPct={budget.consumedPct}
            available={budget.available}
            currency={budget.currency}
          />

          <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
            {daysRemaining !== null ? (
              <span className="text-muted-foreground text-xs">
                {daysRemaining > 0
                  ? `Restan ${daysRemaining} días`
                  : "Último día del mes"}
              </span>
            ) : null}
            {budget.recurring ? (
              <span className="text-muted-foreground flex items-center gap-1 text-xs">
                <Repeat className="size-3" aria-hidden />
                Se renueva
              </span>
            ) : null}
          </div>
        </CardContent>
      </Card>
    </Link>
  );
};
