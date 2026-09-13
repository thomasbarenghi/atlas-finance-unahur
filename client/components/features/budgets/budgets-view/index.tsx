"use client";

import { useMemo, useState } from "react";
import { PiggyBank, Plus } from "lucide-react";
import { EmptyState } from "@/components/common/empty-state";
import { PageHeader } from "@/components/common/page-header";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import {
  firstDayOfMonthIso,
  monthInputValue,
  monthStartFromInput,
} from "@/lib/format";
import { buildMonthOptions } from "@/lib/period";
import { useBudgets } from "@/lib/query/budgets";
import { BudgetCard } from "@/components/features/budgets/budget-card";
import { BudgetFormDialog } from "@/components/features/budgets/budget-form-dialog";
import {
  BudgetsSummary,
  sortBudgetsBySeverity,
} from "@/components/features/budgets/budgets-summary";

export const BudgetsView = () => {
  const [month, setMonth] = useState(() =>
    monthInputValue(firstDayOfMonthIso()),
  );
  const period = monthStartFromInput(month);

  const budgetsQuery = useBudgets(period);

  const [createOpen, setCreateOpen] = useState(false);

  const budgets = useMemo(() => budgetsQuery.data ?? [], [budgetsQuery.data]);
  const sortedBudgets = useMemo(
    () => sortBudgetsBySeverity(budgets),
    [budgets],
  );

  const monthOptions = useMemo(() => buildMonthOptions(), []);

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Presupuestos"
        description="Límite mensual por categoría con estados de consumo."
        actions={
          <Button
            size="icon"
            aria-label="Nuevo presupuesto"
            onClick={() => setCreateOpen(true)}
          >
            <Plus />
          </Button>
        }
      />

      <div className="flex items-center gap-3">
        <Select value={month} onValueChange={setMonth}>
          <SelectTrigger className="w-48" aria-label="Período">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {monthOptions.map((option) => (
              <SelectItem key={option.value} value={option.value}>
                {option.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {budgets.length > 0 ? <BudgetsSummary budgets={budgets} /> : null}

      {budgetsQuery.isLoading ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 3 }).map((_, index) => (
            <Skeleton key={index} className="h-44 w-full" />
          ))}
        </div>
      ) : budgets.length === 0 ? (
        <EmptyState
          icon={PiggyBank}
          title="Sin presupuestos para este período"
          description="Definí un límite por categoría o copiá los del mes anterior."
          action={
            <Button onClick={() => setCreateOpen(true)}>
              <Plus /> Crear presupuesto
            </Button>
          }
        />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {sortedBudgets.map((budget) => (
            <BudgetCard key={budget.id} budget={budget} />
          ))}
        </div>
      )}

      <BudgetFormDialog
        open={createOpen}
        onOpenChange={setCreateOpen}
        defaultPeriod={period}
      />
    </div>
  );
};
