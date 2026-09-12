"use client";

import { useMemo, useState } from "react";
import { Plus } from "lucide-react";
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

  return (
    <section className="flex flex-col gap-3">
      <div className="flex items-center justify-between gap-2">
        <h2 className="font-heading text-base font-semibold">Cuentas</h2>
        <Button
          variant="ghost"
          size="icon-sm"
          aria-label="Nueva cuenta u objetivo"
          onClick={() => setPickerOpen(true)}
        >
          <Plus />
        </Button>
      </div>

      <AccountsList
        accounts={accounts}
        sourceNameById={sourceNameById}
        isLoading={accountsQuery.isLoading}
      />

      <AccountTypePicker
        open={pickerOpen}
        onOpenChange={setPickerOpen}
        onSelect={(type) => {
          setPickerOpen(false);
          setFormKey((key) => key + 1);
          setAccountType(type);
        }}
      />
      <AccountFormDialog
        key={formKey}
        open={accountType !== null}
        onOpenChange={(open) => {
          if (!open) setAccountType(null);
        }}
        initialType={accountType ?? undefined}
      />
    </section>
  );
};
