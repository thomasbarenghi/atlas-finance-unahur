import { cn } from "@/lib/utils";
import { formatCurrency } from "@/lib/format";
import type { AmountProps } from "./amount.types";
import { getAmountPresentation } from "./amount.utils";

export const Amount = ({ value, currency, type, className }: AmountProps) => {
  const { absolute, sign, tone } = getAmountPresentation(value, type);

  return (
    <span className={cn("font-medium tabular-nums", tone, className)}>
      {sign}
      {formatCurrency(absolute, currency)}
    </span>
  );
};
