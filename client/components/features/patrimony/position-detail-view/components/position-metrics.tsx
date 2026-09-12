import { DetailMetric } from "@/components/common/detail-metric";
import { Money } from "@/components/common/money";
import { SectionCard } from "@/components/common/section-card";
import { SignedMoney } from "@/components/common/signed-money";
import type { Position } from "@/lib/api/types";
import { formatDateTime, formatPercentPoints } from "@/lib/format";

export interface PositionMetricsProps {
  position: Position;
  positive: boolean;
}

export const PositionMetrics = ({
  position,
  positive,
}: PositionMetricsProps) => (
  <SectionCard title="Detalle de la posición">
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
      <DetailMetric
        label="Cantidad"
        value={`${position.quantity} ${position.symbol}`}
      />
      <DetailMetric
        label="Costo promedio"
        value={<Money value={position.avgCost} currency={position.currency} />}
      />
      <DetailMetric
        label="Capital invertido"
        value={
          <Money value={position.costBasis} currency={position.currency} />
        }
      />
      <DetailMetric
        label="Precio actual"
        value={
          position.currentPrice === null ? (
            <span className="text-muted-foreground">—</span>
          ) : (
            <Money value={position.currentPrice} currency={position.currency} />
          )
        }
      />
      <DetailMetric
        label="Valor actual"
        value={
          position.currentValue === null ? (
            <span className="text-muted-foreground">—</span>
          ) : (
            <Money value={position.currentValue} currency={position.currency} />
          )
        }
      />
      <DetailMetric
        label="Resultado"
        value={
          position.profitLoss === null ? (
            <span className="text-muted-foreground">—</span>
          ) : (
            <SignedMoney
              value={position.profitLoss}
              currency={position.currency}
            />
          )
        }
      />
      <DetailMetric
        label="Rentabilidad"
        value={
          position.profitLossPct === null ? (
            <span className="text-muted-foreground">—</span>
          ) : (
            <span className={positive ? "text-success" : "text-destructive"}>
              {positive ? "+" : ""}
              {formatPercentPoints(position.profitLossPct)}
            </span>
          )
        }
      />
      <DetailMetric label="Moneda" value={position.currency} />
      <DetailMetric
        label="Última cotización"
        value={
          position.quoteDate ? (
            formatDateTime(position.quoteDate)
          ) : (
            <span className="text-muted-foreground">—</span>
          )
        }
      />
    </div>
  </SectionCard>
);
