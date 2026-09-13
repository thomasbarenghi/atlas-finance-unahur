import { formatApproxCurrency, formatCurrency } from "@/lib/format";
import { cn } from "@/lib/utils";
import type { MoneyProps } from "./money.types";

export const Money = ({
  value,
  currency,
  approximate = false,
  className,
}: MoneyProps) => {
  const display = approximate
    ? formatApproxCurrency(value, currency)
    : formatCurrency(value, currency);

  return <span className={cn("tabular-nums", className)}>{display}</span>;
};
