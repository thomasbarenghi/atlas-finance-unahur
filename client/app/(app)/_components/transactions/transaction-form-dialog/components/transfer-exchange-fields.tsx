"use client";

import { ArrowRight } from "lucide-react";
import { FIELD_INPUT } from "@/components/common/ui-classes";
import { Input } from "@/components/ui/input";
import type { Account } from "@/lib/api/types";
import { formatCurrency } from "@/lib/format";
import { cn } from "@/lib/utils";

export interface TransferExchangeFieldsProps {
  sourceAccount: Account;
  destinationAccount: Account;
  rateInput: string;
  onRateChange: (value: string) => void;
  destinationAmount: number;
}

export const TransferExchangeFields = ({
  sourceAccount,
  destinationAccount,
  rateInput,
  onRateChange,
  destinationAmount,
}: TransferExchangeFieldsProps) => {
  return (
    <div className="border-line2 bg-secondary/40 flex flex-col gap-2.5 rounded-2xl border p-3.5">
      <div className="flex items-center gap-2">
        <span className="text-muted-foreground shrink-0 text-[10.5px] font-medium">
          1 {destinationAccount.currency} =
        </span>
        <Input
          value={rateInput}
          onChange={(event) => onRateChange(event.target.value)}
          inputMode="decimal"
          aria-label="Cotización de la transferencia"
          placeholder="Cotización"
          className={cn(
            FIELD_INPUT,
            "h-9 max-w-[150px] text-right tabular-nums",
          )}
        />
        <span className="text-muted-foreground text-[10.5px] font-medium">
          {sourceAccount.currency}
        </span>
      </div>
      <p className="text-muted-foreground text-[10px] leading-[14px]">
        sugerida por la API · podés escribir otra. No se guarda con el
        movimiento.
      </p>
      <div className="flex items-center justify-between gap-3">
        <span className="text-muted-foreground flex items-center gap-1 text-[10.5px]">
          Llegan a {destinationAccount.name}
          <ArrowRight className="size-3" aria-hidden />
        </span>
        <span className="text-ink text-[13px] leading-[18px] font-semibold tabular-nums">
          {formatCurrency(destinationAmount, destinationAccount.currency)}
        </span>
      </div>
    </div>
  );
};
