import { TrendingDown, TrendingUp } from "lucide-react";
import { formatPercentPoints } from "@/lib/format";
import { cn } from "@/lib/utils";
import type { TrendBadgeProps } from "./trend-badge.types";

export const TrendBadge = ({ deltaPct, label, className }: TrendBadgeProps) => {
  if (deltaPct === null) return null;

  const positive = deltaPct >= 0;
  const DeltaIcon = positive ? TrendingUp : TrendingDown;

  return (
    <span
      className={cn(
        "flex w-fit items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium",
        positive
          ? "bg-success/10 text-success"
          : "bg-destructive/10 text-destructive",
        className,
      )}
    >
      <DeltaIcon className="size-3.5" aria-hidden />
      {positive ? "+" : ""}
      {formatPercentPoints(deltaPct)}
      {label ? <span className="font-normal">{label}</span> : null}
    </span>
  );
};
