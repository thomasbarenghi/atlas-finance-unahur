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

  const openForm = (type: AccountType) => {
    setPickerOpen(false);
    setFormKey((key) => key + 1);
    setAccountType(type);
  };

  return (
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
