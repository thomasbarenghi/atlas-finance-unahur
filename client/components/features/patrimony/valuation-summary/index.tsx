import { DetailMetric } from "@/components/common/detail-metric";
import { Money } from "@/components/common/money";
import { SignedMoney } from "@/components/common/signed-money";
import { formatDate, formatPercentPoints } from "@/lib/format";
import { valuationChange } from "@/lib/patrimony";
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
            <SignedMoney value={change.delta} currency={currency} />
          )
        }
      />
      <DetailMetric
        label="Variación %"
        value={
          change.deltaPct === null ? (
            <span className="text-muted-foreground">—</span>
          ) : (
            <span className={positive ? "text-success" : "text-destructive"}>
              {positive ? "+" : ""}
              {formatPercentPoints(change.deltaPct)}
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
