"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Pencil, PiggyBank, Repeat, Trash2 } from "lucide-react";
import { BudgetProgress } from "@/components/common/budget-progress";
import { CategoryBadge } from "@/components/common/category-badge";
import { ConfirmActionDialog } from "@/components/common/confirm-action-dialog";
import {
  DetailPage,
  DetailPageNotFound,
  DetailPageSkeleton,
} from "@/components/common/detail-page";
import { SectionCard } from "@/components/common/section-card";
import { StatusBadge } from "@/components/common/status-badge";
import { Button } from "@/components/ui/button";
import { useConfirmAction } from "@/hooks/use-confirm-action";
import type { Budget } from "@/lib/api/types";
import { budgetPace } from "@/lib/budget";
import { formatCurrency, formatMonth, monthStartFromInput } from "@/lib/format";
import { useDeleteBudget } from "@/lib/query/budgets";
import { BudgetFormDialog } from "@/components/features/budgets/budget-form-dialog";
import { TransactionList } from "@/components/features/transactions/transaction-list";
import { BudgetPaceCard } from "./components/budget-pace-card";
import { useBudgetDetail } from "./hooks/use-budget-detail";

export const BudgetDetailView = () => {
  const {
    budget,
    month,
    isLoading,
    transactions,
    isLoadingTransactions,
    pagination,
    categoryById,
    accountNameById,
  } = useBudgetDetail();
  const deleteBudget = useDeleteBudget();
  const router = useRouter();

  const [editOpen, setEditOpen] = useState(false);

  const deleteAction = useConfirmAction<Budget>({
    run: (target) => deleteBudget.mutateAsync(target.id),
    successMessage: "Presupuesto eliminado",
    errorMessage: "No se pudo eliminar el presupuesto",
    onSuccess: () => router.push("/budgets"),
  });

  if (isLoading) {
    return <DetailPageSkeleton />;
  }

  if (!budget) {
    return (
      <DetailPageNotFound
        entityLabel="Presupuesto"
        icon={PiggyBank}
        title="Presupuesto no encontrado"
        description="El presupuesto que buscás no existe o fue eliminado."
      />
    );
  }

  const pace = budgetPace(budget);

  return (
    <DetailPage
      title={budget.category.name}
      description={`${formatMonth(monthStartFromInput(month))} · ${budget.currency}`}
      actions={
        <>
          <Button
            variant="outline"
            size="icon"
            aria-label="Editar presupuesto"
            onClick={() => setEditOpen(true)}
          >
            <Pencil />
          </Button>
          <Button
            variant="outline"
            size="icon"
            aria-label="Eliminar presupuesto"
            className="text-destructive hover:text-destructive"
            onClick={() => deleteAction.request(budget)}
          >
            <Trash2 />
          </Button>
        </>
      }
    >
      <SectionCard
        title="Consumo"
        description="Gasto acumulado y disponible del mes."
      >
        <div className="flex items-center justify-between gap-3">
          <CategoryBadge category={budget.category} />
          <div className="flex items-center gap-2">
            {budget.recurring ? (
              <span className="text-muted-foreground flex items-center gap-1 text-xs">
                <Repeat className="size-3.5" aria-hidden />
                Se renueva
              </span>
            ) : null}
            <StatusBadge variant="budget" status={budget.status} />
          </div>
        </div>
        <div className="mt-4 flex items-baseline justify-between gap-2">
          <span className="font-heading text-2xl font-semibold tabular-nums">
            {formatCurrency(budget.spent, budget.currency)}
          </span>
          <span className="text-muted-foreground text-sm">
            de {formatCurrency(budget.limit, budget.currency)}
          </span>
        </div>
        <div className="mt-3">
          <BudgetProgress
            status={budget.status}
            consumedPct={budget.consumedPct}
            available={budget.available}
            currency={budget.currency}
          />
        </div>
      </SectionCard>

      <BudgetPaceCard
        pace={pace}
        limit={budget.limit}
        spent={budget.spent}
        currency={budget.currency}
      />

      <SectionCard
        title="Movimientos de la categoría"
        description="Qué compone este presupuesto en el mes."
      >
        <TransactionList
          transactions={transactions}
          isLoading={isLoadingTransactions}
          accountNameById={accountNameById}
          categoryById={categoryById}
          pagination={pagination}
        />
      </SectionCard>

      <BudgetFormDialog
        key={budget.id}
        open={editOpen}
        onOpenChange={setEditOpen}
        budget={budget}
        defaultPeriod={budget.period}
      />
      <ConfirmActionDialog
        action={deleteAction}
        title="Eliminar presupuesto"
        description={(target) =>
          `Se eliminará el presupuesto de "${target.category.name}".`
        }
        confirmLabel="Eliminar"
      />
    </DetailPage>
  );
};
