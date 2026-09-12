import { DetailMetric } from "@/components/common/detail-metric";
import { Money } from "@/components/common/money";
import { formatCurrency, formatDate, formatPercent } from "@/lib/format";
import { valuationChange } from "@/lib/patrimony";
import { cn } from "@/lib/utils";
import type { ValuationSummaryProps } from "./valuation-summary.types";

export const ValuationSummary = ({
  valuations,
  currency,
}: ValuationSummaryProps) => {
  const change = valuationChange(valuations);

  if (!change) return null;

  const positive = change.delta >= 0;

  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
      <DetailMetric
        label="Valor actual"
        value={<Money value={change.current} currency={currency} />}
      />
      <DetailMetric
        label="Valor anterior"
        value={
          change.previous === null ? (
            <span className="text-muted-foreground">—</span>
          ) : (
            <Money value={change.previous} currency={currency} />
          )
        }
      />
      <DetailMetric
        label="Variación"
        value={
          change.previous === null ? (
            <span className="text-muted-foreground">—</span>
          ) : (
            <span className={positive ? "text-success" : "text-destructive"}>
              {positive ? "+" : "−"}
              {formatCurrency(Math.abs(change.delta), currency)}
            </span>
          )
        }
      />
      <DetailMetric
        label="Variación %"
        value={
          change.deltaPct === null ? (
            <span className="text-muted-foreground">—</span>
          ) : (
            <span
              className={cn(positive ? "text-success" : "text-destructive")}
            >
              {positive ? "+" : ""}
              {formatPercent(change.deltaPct / 100)}
            </span>
          )
        }
      />
      <DetailMetric
        label="Última valuación"
        value={formatDate(change.date)}
        className="col-span-2 sm:col-span-1"
      />
    </div>
  );
};
