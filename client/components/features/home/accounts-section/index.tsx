"use client";

import { useMemo, useState } from "react";
import { Plus } from "lucide-react";
import { SectionHeader } from "@/components/common/section-header";
import { Button } from "@/components/ui/button";
import type { AccountType } from "@/lib/api/types";
import { useAccounts } from "@/lib/query/accounts";
import { AccountFormDialog } from "@/components/features/accounts/account-form-dialog";
import { AccountTypePicker } from "@/components/features/accounts/account-type-picker";
import { AccountsList } from "@/components/features/accounts/accounts-list";

export const AccountsSection = () => {
  const accountsQuery = useAccounts();
  const [pickerOpen, setPickerOpen] = useState(false);
  const [accountType, setAccountType] = useState<AccountType | null>(null);
  const [formKey, setFormKey] = useState(0);

  const accounts = useMemo(
    () => accountsQuery.data ?? [],
    [accountsQuery.data],
  );
  const sourceNameById = useMemo(
    () => new Map(accounts.map((item) => [item.id, item.name])),
    [accounts],
  );

  const regularAccounts = useMemo(
    () => accounts.filter((account) => account.type !== "goal"),
    [accounts],
  );
  const goalAccounts = useMemo(
    () => accounts.filter((account) => account.type === "goal"),
    [accounts],
  );

  const openForm = (type: AccountType) => {
    setPickerOpen(false);
    setFormKey((key) => key + 1);
    setAccountType(type);
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
        <AccountsList
          accounts={regularAccounts}
          sourceNameById={sourceNameById}
          isLoading={accountsQuery.isLoading}
        />
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
              onClick={() => openForm("goal")}
            >
              <Plus />
            </Button>
          }
        />
        <AccountsList
          accounts={goalAccounts}
          sourceNameById={sourceNameById}
          isLoading={accountsQuery.isLoading}
          emptyTitle="Todavía no tenés metas"
          emptyDescription="Creá un objetivo de ahorro y seguí su progreso."
        />
      </section>

      <AccountTypePicker
        open={pickerOpen}
        onOpenChange={setPickerOpen}
        onSelect={openForm}
      />
      <AccountFormDialog
        key={formKey}
        open={accountType !== null}
        onOpenChange={(open) => {
          if (!open) setAccountType(null);
        }}
        initialType={accountType ?? undefined}
      />
    </div>
  );
};
