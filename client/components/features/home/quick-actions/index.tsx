"use client";

import { useMemo, useState } from "react";
import { ArrowLeftRight, PiggyBank, TrendingUp } from "lucide-react";
import { Button } from "@/components/ui/button";
import { firstDayOfMonthIso } from "@/lib/format";
import { useAccounts } from "@/lib/query/accounts";
import { useCategories } from "@/lib/query/categories";
import { BudgetFormDialog } from "@/components/features/budgets/budget-form-dialog";
import { PositionFormDialog } from "@/components/features/assets/position-form-dialog";
import { TransactionFormDialog } from "@/components/features/transactions/transaction-form-dialog";

export const QuickActions = () => {
  const accountsQuery = useAccounts();
  const categoriesQuery = useCategories();

  const [transactionOpen, setTransactionOpen] = useState(false);
  const [budgetOpen, setBudgetOpen] = useState(false);
  const [positionOpen, setPositionOpen] = useState(false);

  const accounts = useMemo(
    () => accountsQuery.data ?? [],
    [accountsQuery.data],
  );
  const categories = useMemo(
    () => categoriesQuery.data ?? [],
    [categoriesQuery.data],
  );

  return (
    <>
      <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
        <Button
          variant="outline"
          className="h-auto justify-start gap-2 py-3"
          onClick={() => setTransactionOpen(true)}
        >
          <ArrowLeftRight className="text-primary size-4" aria-hidden />
          Registrar movimiento
        </Button>
        <Button
          variant="outline"
          className="h-auto justify-start gap-2 py-3"
          onClick={() => setBudgetOpen(true)}
        >
          <PiggyBank className="text-primary size-4" aria-hidden />
          Crear presupuesto
        </Button>
        <Button
          variant="outline"
          className="h-auto justify-start gap-2 py-3"
          onClick={() => setPositionOpen(true)}
        >
          <TrendingUp className="text-primary size-4" aria-hidden />
          Agregar inversión
        </Button>
      </div>

      <TransactionFormDialog
        open={transactionOpen}
        onOpenChange={setTransactionOpen}
        accounts={accounts}
        categories={categories}
      />
      <BudgetFormDialog
        open={budgetOpen}
        onOpenChange={setBudgetOpen}
        categories={categories}
        defaultPeriod={firstDayOfMonthIso()}
      />
      <PositionFormDialog open={positionOpen} onOpenChange={setPositionOpen} />
    </>
  );
};
