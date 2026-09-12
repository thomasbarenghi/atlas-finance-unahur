import { Progress } from "@/components/ui/progress";
import { formatCurrency, formatPercent } from "@/lib/format";
import { cn } from "@/lib/utils";
import { budgetIndicatorClass } from "./budget-progress.utils";
import type { BudgetProgressProps } from "./budget-progress.types";

export const BudgetProgress = ({
  status,
  consumedPct,
  available,
  currency,
}: BudgetProgressProps) => {
  const exceeded = status === "exceeded";

  return (
    <div className="flex flex-col gap-2">
      <Progress
        value={Math.min(consumedPct, 100)}
        className={cn("h-3", budgetIndicatorClass(status))}
      />
      <div className="flex items-center justify-between gap-2 text-xs">
        <span
          className={exceeded ? "text-destructive" : "text-muted-foreground"}
        >
          {exceeded
            ? `Excedido por ${formatCurrency(Math.abs(available), currency)}`
            : `Disponible ${formatCurrency(available, currency)}`}
        </span>
        <span
          className={cn(
            "font-medium tabular-nums",
            exceeded
              ? "text-destructive"
              : status === "warning"
                ? "text-warning"
                : "text-muted-foreground",
          )}
        >
          {formatPercent(consumedPct / 100)}
        </span>
      </div>
    </div>
  );
};
