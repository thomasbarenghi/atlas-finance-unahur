import type { TransactionType } from "@/lib/api/types";
import { cn } from "@/lib/utils";
import { formatCurrency } from "@/lib/format";
import { getAmountPresentation } from "./amount.utils";

export interface AmountProps {
  value: number;
  currency: string;
  type?: TransactionType;
  className?: string;
}

export const Amount = ({ value, currency, type, className }: AmountProps) => {
  const { absolute, sign, tone } = getAmountPresentation(value, type);

  return (
    <span className={cn("font-medium tabular-nums", tone, className)}>
      {sign}
      {formatCurrency(absolute, currency)}
    </span>
  );
};
