import { cn } from "@/lib/utils";
import type { DetailMetricProps } from "./detail-metric.types";

export const DetailMetric = ({
  label,
  value,
  hint,
  className,
}: DetailMetricProps) => {
  return (
    <div
      className={cn(
        "bg-card flex flex-col gap-1 rounded-2xl border p-3",
        className,
      )}
      title={hint}
    >
      <span className="text-muted-foreground truncate text-xs">{label}</span>
      <span className="truncate text-sm font-semibold tabular-nums">
        {value}
      </span>
    </div>
  );
};
