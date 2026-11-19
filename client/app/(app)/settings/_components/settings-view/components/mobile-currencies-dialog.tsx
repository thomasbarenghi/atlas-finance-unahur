"use client";

import { useState } from "react";
import { Coins } from "lucide-react";
import { DialogShell } from "@/components/common/dialog-shell";
import { MenuRow } from "@/components/common/menu-row";
import { useAccounts } from "@/lib/query/accounts";
import { CurrenciesCard } from "./currencies-card";

export const MobileCurrenciesDialog = () => {
  const [open, setOpen] = useState(false);
  const accounts = useAccounts().data ?? [];

  if (new Set(accounts.map((account) => account.currency)).size <= 1) {
    return null;
  }

  return (
    <>
      <MenuRow
        icon={Coins}
        label="Monedas y cotización"
        onClick={() => setOpen(true)}
      />
      <DialogShell
        open={open}
        onOpenChange={setOpen}
        title="Monedas y cotización"
        description="Elegí la moneda principal del patrimonio."
        contentClassName="max-h-[90dvh] overflow-y-auto"
      >
        <div className="dialog-body">
          <CurrenciesCard />
        </div>
      </DialogShell>
    </>
  );
};
