"use client";

import { useMemo, useState } from "react";
import { PiggyBank, Plus } from "lucide-react";
import { ConfirmDialog } from "@/components/common/confirm-dialog";
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
import { useConfirmAction } from "@/hooks/use-confirm-action";
import type { Budget } from "@/lib/api/types";
import { firstDayOfMonthIso, formatMonth, monthInputValue } from "@/lib/format";
import { useBudgets, useDeleteBudget } from "@/lib/query/budgets";
import { useCategories } from "@/lib/query/categories";
import { BudgetCard } from "@/components/features/budgets/budget-card";
import { BudgetFormDialog } from "@/components/features/budgets/budget-form-dialog";

export const BudgetsView = () => {
  const [month, setMonth] = useState(() =>
    monthInputValue(firstDayOfMonthIso()),
  );
  const period = `${month}-01`;

  const budgetsQuery = useBudgets(period);
  const categoriesQuery = useCategories();
  const deleteBudget = useDeleteBudget();

  const [createOpen, setCreateOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<Budget | null>(null);

  const deleteAction = useConfirmAction<Budget>({
    run: (budget) => deleteBudget.mutateAsync(budget.id),
    successMessage: "Presupuesto eliminado",
    errorMessage: "No se pudo eliminar",
  });

  const categories = useMemo(
    () => categoriesQuery.data ?? [],
    [categoriesQuery.data],
  );
  const budgets = useMemo(() => budgetsQuery.data ?? [], [budgetsQuery.data]);

  const monthOptions = useMemo(() => {
    const base = new Date();
    return Array.from({ length: 12 }, (_, index) => {
      const date = new Date(base.getFullYear(), base.getMonth() + index - 5, 1);
      const value = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
      return { value, label: formatMonth(`${value}-01`) };
    });
  }, []);

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
          {budgets.map((budget) => (
            <BudgetCard
              key={budget.id}
              budget={budget}
              onEdit={setEditTarget}
              onDelete={deleteAction.request}
            />
          ))}
        </div>
      )}

      <BudgetFormDialog
        open={createOpen}
        onOpenChange={setCreateOpen}
        categories={categories}
        defaultPeriod={period}
      />
      <BudgetFormDialog
        key={editTarget?.id ?? "edit"}
        open={Boolean(editTarget)}
        onOpenChange={(open) => {
          if (!open) setEditTarget(null);
        }}
        budget={editTarget ?? undefined}
        categories={categories}
        defaultPeriod={period}
      />
      <ConfirmDialog
        open={deleteAction.isOpen}
        onOpenChange={(open) => {
          if (!open) deleteAction.clear();
        }}
        title="Eliminar presupuesto"
        description={`Se eliminará el presupuesto de "${deleteAction.target?.category.name ?? ""}".`}
        confirmLabel="Eliminar"
        variant="destructive"
        isPending={deleteAction.isPending}
        onConfirm={deleteAction.confirm}
      />
    </div>
  );
};
