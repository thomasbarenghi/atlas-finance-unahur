import type { ReactNode } from "react";
import { MetricInfo } from "@/components/common/metric-info";
import { cn } from "@/lib/utils";

export interface DetailMetricProps {
  label: string;
  value: ReactNode;
  hint?: string;
  info?: {
    formula: string;
    description: string;
  };
  className?: string;
}

export const DetailMetric = ({
  label,
  value,
  hint,
  info,
  className,
}: DetailMetricProps) => {
  return (
    <div
      className={cn(
        "bg-card border-line flex min-w-0 flex-col gap-0.5 rounded-[14px] border px-3 py-2.5 sm:gap-[3px] sm:rounded-[18px] sm:px-[18px] sm:py-3.5",
        className,
      )}
      title={hint}
    >
      <span className="text-muted-foreground flex items-center gap-1 truncate text-[9.5px] leading-[13px] sm:text-[11.5px] sm:leading-4">
        {label}
        {info ? (
          <MetricInfo
            label={label}
            formula={info.formula}
            description={info.description}
          />
        ) : null}
      </span>
      <span className="text-ink truncate text-[11.5px] leading-[14px] font-semibold tabular-nums sm:text-[15px] sm:leading-[19px]">
        {value}
      </span>
    </div>
  );
};
