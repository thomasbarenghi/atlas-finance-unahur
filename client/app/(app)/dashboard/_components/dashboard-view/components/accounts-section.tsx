"use client";

import { useState } from "react";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { AccountType } from "@/lib/api/types";
import { useAccounts } from "@/lib/query/accounts";
import { AccountFormDialog } from "@/app/(app)/_components/accounts/account-form-dialog";
import { AccountTypePicker } from "@/app/(app)/_components/accounts/account-type-picker";
import { AccountsList } from "@/app/(app)/_components/accounts/accounts-list";

export const AccountsSection = () => {
  const accountsQuery = useAccounts();
  const [pickerOpen, setPickerOpen] = useState(false);
  const [accountType, setAccountType] = useState<AccountType | null>(null);
  const [formKey, setFormKey] = useState(0);

  const accounts = accountsQuery.data ?? [];

  const openForm = (type: AccountType) => {
    setPickerOpen(false);
    setFormKey((key) => key + 1);
    setAccountType(type);
  };

  return (
    <section className="flex flex-col gap-3">
      <div className="flex items-center justify-between gap-2">
        <h2 className="font-heading text-base font-semibold">Cuentas</h2>
        <div className="flex shrink-0 gap-1">
          <Button
            variant="ghost"
            size="icon-sm"
            aria-label="Nueva cuenta"
            onClick={() => setPickerOpen(true)}
          >
            <Plus />
          </Button>
        </div>
      </div>
      <AccountsList
        accounts={accounts}
        isLoading={accountsQuery.isLoading}
        emptyAction={
          <Button size="sm" onClick={() => setPickerOpen(true)}>
            <Plus /> Cargar una cuenta
          </Button>
        }
      />

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
    </section>
  );
};
