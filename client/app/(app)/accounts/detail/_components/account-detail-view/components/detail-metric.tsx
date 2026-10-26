import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

export interface DetailMetricProps {
  label: string;
  value: ReactNode;
  hint?: string;
  className?: string;
}

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
