"use client";

import type { UseFormReturn } from "react-hook-form";
import { FormField, FormItem, FormMessage } from "@/components/ui/form";
import type { Account, TransactionType } from "@/lib/api/types";
import { formatCurrency } from "@/lib/format";
import type { TransactionFormValues } from "@/lib/validation/transactions";
import { AmountKeypad } from "./amount-keypad";
import {
  signForTransactionType,
  type AmountInputState,
} from "../hooks/use-amount-input";

export interface TransactionAmountPanelProps {
  form: UseFormReturn<TransactionFormValues>;
  type: TransactionType;
  account?: Account;
  amountInput: AmountInputState;
}

export const TransactionAmountPanel = ({
  form,
  type,
  account,
  amountInput,
}: TransactionAmountPanelProps) => {
  const { expression, evaluated, hasOperator, handleKey } = amountInput;
  const currency = account?.currency ?? "ARS";

  return (
    <>
      <div className="flex flex-col items-center gap-0.5 py-1">
        {hasOperator ? (
          <span className="text-muted-foreground text-[11px] tabular-nums">
            {expression}
          </span>
        ) : null}
        <span className="font-heading text-foreground text-[34px] leading-[43px] font-semibold tabular-nums sm:text-[38px] sm:leading-[48px]">
          {signForTransactionType(type)}
          {formatCurrency(evaluated, currency)}
        </span>
        {type !== "transfer" ? (
          <span className="text-muted-foreground text-[10px] leading-[14px] sm:text-[10.5px]">
            Disponible {formatCurrency(account?.currentBalance ?? 0, currency)}
          </span>
        ) : null}
        <FormField
          control={form.control}
          name="amount"
          render={({ fieldState }) =>
            fieldState.error ? (
              <FormItem className="items-center">
                <FormMessage className="text-center" />
              </FormItem>
            ) : (
              <></>
            )
          }
        />
      </div>

      <AmountKeypad onKey={handleKey} />
    </>
  );
};
