"use client";

import type { ReactNode } from "react";
import { useState } from "react";
import { Plus } from "lucide-react";
import { PeriodSelector } from "@/components/common/period-selector";
import { PRIMARY_ACTION_BUTTON } from "@/components/common/ui-classes";
import { Button } from "@/components/ui/button";
import { TransactionFormDialog } from "@/app/(app)/_components/transactions/transaction-form-dialog";
import { useAccounts } from "@/lib/query/accounts";
import { useCategories } from "@/lib/query/categories";

export interface HeaderActionsProps {
  leading?: ReactNode;
}

export const HeaderActions = ({ leading }: HeaderActionsProps) => {
  const accounts = useAccounts().data ?? [];
  const categories = useCategories().data ?? [];
  const [open, setOpen] = useState(false);

  return (
    <div className="flex items-center gap-2.5">
      {leading}
      <PeriodSelector showCalendar />
      <Button onClick={() => setOpen(true)} className={PRIMARY_ACTION_BUTTON}>
        <Plus className="size-4" aria-hidden />
        Nuevo movimiento
      </Button>
      <TransactionFormDialog
        open={open}
        onOpenChange={setOpen}
        accounts={accounts}
        categories={categories}
      />
    </div>
  );
};
