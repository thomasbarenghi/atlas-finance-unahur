import { formatCurrency } from "@/lib/format";
import { cn } from "@/lib/utils";
import type { SignedMoneyProps } from "./signed-money.types";

export const SignedMoney = ({
  value,
  currency,
  showSign = true,
  className,
}: SignedMoneyProps) => {
  const positive = value >= 0;

  return (
    <span
      className={cn(
        "tabular-nums",
        positive ? "text-success" : "text-destructive",
        className,
      )}
    >
      {showSign ? (positive ? "+" : "−") : null}
      {formatCurrency(Math.abs(value), currency)}
    </span>
  );
};
