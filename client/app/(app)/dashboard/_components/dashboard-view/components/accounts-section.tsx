"use client";

import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  AccountCreation,
  useAccountCreation,
} from "@/app/(app)/_components/accounts/account-creation";
import { AccountsList } from "@/app/(app)/_components/accounts/accounts-list";
import { useAccounts } from "@/lib/query/accounts";

export const AccountsSection = () => {
  const accountsQuery = useAccounts();
  const creation = useAccountCreation();
  const accounts = accountsQuery.data ?? [];

  return (
    <section className="flex flex-col gap-2.5">
      <div className="flex h-[30px] items-center justify-between gap-2 md:h-7">
        <h2 className="text-foreground font-heading text-[15px] leading-[19px] font-semibold md:text-[17px] md:leading-[21px]">
          Cuentas
        </h2>
        <Button
          variant="ghost"
          size="sm"
          className="text-primary h-7 gap-1.5 px-2.5 text-[11.5px] leading-[16px] font-semibold"
          onClick={creation.openPicker}
        >
          <Plus className="size-3.5" aria-hidden />
          <span className="hidden md:inline">Nueva cuenta</span>
          <span className="sr-only md:hidden">Nueva cuenta</span>
        </Button>
      </div>
      <AccountsList
        accounts={accounts}
        isLoading={accountsQuery.isLoading}
        emptyAction={
          <Button size="sm" onClick={creation.openPicker}>
            <Plus /> Cargar una cuenta
          </Button>
        }
      />

      <AccountCreation creation={creation} />
    </section>
  );
};
