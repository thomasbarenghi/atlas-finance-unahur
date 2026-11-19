import { TrendingDown, TrendingUp } from "lucide-react";
import { formatPercentPoints } from "@/lib/format";
import { cn } from "@/lib/utils";

export interface TrendBadgeProps {
  deltaPct: number | null;
}

export const TrendBadge = ({ deltaPct }: TrendBadgeProps) => {
  if (deltaPct === null) return null;

  const positive = deltaPct >= 0;
  const DeltaIcon = positive ? TrendingUp : TrendingDown;

  return (
    <span
      className={cn(
        "flex h-[21px] w-fit items-center gap-1 rounded-full px-2 text-[10px] leading-[14px] font-bold md:h-6 md:gap-[5px] md:px-[9px] md:text-[11px] md:leading-[15px]",
        positive ? "bg-accent text-primary" : "bg-destructive/10 text-expense",
      )}
    >
      <DeltaIcon className="size-[11px] md:size-3" aria-hidden />
      {positive ? "+" : ""}
      {formatPercentPoints(deltaPct)}
    </span>
  );
};
