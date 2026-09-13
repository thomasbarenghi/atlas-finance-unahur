"use client";

import { useMemo, useState } from "react";
import { Plus } from "lucide-react";
import { SectionHeader } from "@/components/common/section-header";
import { Button } from "@/components/ui/button";
import type { AccountType } from "@/lib/api/types";
import { useAccounts } from "@/lib/query/accounts";
import { useGoals } from "@/lib/query/goals";
import { AccountFormDialog } from "@/components/features/accounts/account-form-dialog";
import { AccountTypePicker } from "@/components/features/accounts/account-type-picker";
import { AccountsList } from "@/components/features/accounts/accounts-list";
import { GoalFormDialog } from "@/components/features/goals/goal-form-dialog";
import { GoalsList } from "@/components/features/goals/goals-list";

export const AccountsSection = () => {
  const accountsQuery = useAccounts();
  const goalsQuery = useGoals();
  const [pickerOpen, setPickerOpen] = useState(false);
  const [accountType, setAccountType] = useState<AccountType | null>(null);
  const [formKey, setFormKey] = useState(0);
  const [goalFormOpen, setGoalFormOpen] = useState(false);
  const [goalFormKey, setGoalFormKey] = useState(0);

  const accounts = useMemo(
    () => accountsQuery.data ?? [],
    [accountsQuery.data],
  );
  const goals = useMemo(() => goalsQuery.data ?? [], [goalsQuery.data]);
  const sourceNameById = useMemo(
    () => new Map(accounts.map((item) => [item.id, item.name])),
    [accounts],
  );

  const openForm = (type: AccountType) => {
    setPickerOpen(false);
    setFormKey((key) => key + 1);
    setAccountType(type);
  };

  const openGoalForm = () => {
    setGoalFormKey((key) => key + 1);
    setGoalFormOpen(true);
  };

  return (
    <div className="flex flex-col gap-6">
      <section className="flex flex-col gap-3">
        <SectionHeader
          title="Cuentas"
          actions={
            <Button
              variant="ghost"
              size="icon-sm"
              aria-label="Nueva cuenta"
              onClick={() => setPickerOpen(true)}
            >
              <Plus />
            </Button>
          }
        />
        <AccountsList accounts={accounts} isLoading={accountsQuery.isLoading} />
      </section>

      <section className="flex flex-col gap-3">
        <SectionHeader
          title="Metas"
          description="Objetivos de ahorro con fecha y monto."
          actions={
            <Button
              variant="ghost"
              size="icon-sm"
              aria-label="Nueva meta"
              onClick={openGoalForm}
            >
              <Plus />
            </Button>
          }
        />
        <GoalsList
          goals={goals}
          sourceNameById={sourceNameById}
          isLoading={goalsQuery.isLoading}
        />
      </section>

      <AccountTypePicker
        open={pickerOpen}
        onOpenChange={setPickerOpen}
        onSelect={openForm}
      />
      <AccountFormDialog
        key={`account-${formKey}`}
        open={accountType !== null}
        onOpenChange={(open) => {
          if (!open) setAccountType(null);
        }}
        initialType={accountType ?? undefined}
      />
      <GoalFormDialog
        key={`goal-${goalFormKey}`}
        open={goalFormOpen}
        onOpenChange={setGoalFormOpen}
      />
    </div>
  );
};
