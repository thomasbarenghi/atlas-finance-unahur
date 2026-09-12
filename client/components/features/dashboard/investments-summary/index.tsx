import Link from "next/link";
import { TrendingDown, TrendingUp } from "lucide-react";
import { EmptyState } from "@/components/common/empty-state";
import { Money } from "@/components/common/money";
import { SignedMoney } from "@/components/common/signed-money";
import { WarningBadge } from "@/components/common/warning-badge";
import {
  formatCurrency,
  formatDateTime,
  formatPercentPoints,
  formatTimeAgo,
} from "@/lib/format";
import { cn } from "@/lib/utils";
import type { InvestmentsSummaryProps } from "./investments-summary.types";

const PALETTE = [
  "var(--chart-1)",
  "var(--chart-2)",
  "var(--chart-3)",
  "var(--chart-4)",
  "var(--chart-5)",
];

export const InvestmentsSummary = ({
  totalValue,
  totalCost,
  profitLoss,
  profitLossPct,
  staleQuotes,
  positions,
  currency,
}: InvestmentsSummaryProps) => {
  const positive = profitLoss >= 0;
  const ProfitIcon = positive ? TrendingUp : TrendingDown;
  const distributionTotal = positions.reduce(
    (sum, position) => sum + position.value,
    0,
  );

  if (positions.length === 0) {
    return (
      <EmptyState
        icon={TrendingUp}
        title="Todavía no tenés inversiones"
        description="Cargá un instrumento y su costo promedio para valuarlo."
      />
    );
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
        <div className="flex flex-col gap-0.5">
          <span className="text-muted-foreground text-xs">Valor actual</span>
          <span className="font-heading text-xl font-semibold tabular-nums">
            {formatCurrency(totalValue, currency)}
          </span>
        </div>
        <div className="flex flex-col gap-0.5">
          <span className="text-muted-foreground text-xs">
            Capital invertido
          </span>
          <span className="text-xl font-semibold tabular-nums">
            {formatCurrency(totalCost, currency)}
          </span>
        </div>
        <div className="flex flex-col gap-0.5">
          <span className="text-muted-foreground text-xs">Resultado</span>
          <span className="flex items-center gap-1 text-xl font-semibold">
            <ProfitIcon className="size-4" aria-hidden />
            <SignedMoney
              value={profitLoss}
              currency={currency}
              className="text-xl font-semibold"
            />
          </span>
          <span
            className={cn(
              "text-xs tabular-nums",
              positive ? "text-success" : "text-destructive",
            )}
          >
            {positive ? "+" : ""}
            {formatPercentPoints(profitLossPct)}
          </span>
        </div>
      </div>

      <div className="flex h-3 w-full overflow-hidden rounded-full">
        {positions.map((position, index) => (
          <div
            key={`${position.symbol}-${position.originalCurrency}`}
            style={{
              width:
                distributionTotal > 0
                  ? `${(position.value / distributionTotal) * 100}%`
                  : "0%",
              backgroundColor: PALETTE[index % PALETTE.length],
            }}
            title={`${position.symbol}: ${formatCurrency(position.value, currency)}`}
          />
        ))}
      </div>

      <ul className="flex flex-col gap-3">
        {positions.map((position, index) => {
          const hasQuote = position.originalValue > 0;
          const profitPositive = (position.originalProfitLoss ?? 0) >= 0;
          const converted = position.originalCurrency !== currency && hasQuote;

          return (
            <li key={`${position.symbol}-${position.originalCurrency}`}>
              <Link
                href={`/patrimony/investments/detail?symbol=${position.symbol}&currency=${position.originalCurrency}`}
                className="hover:bg-muted/40 -mx-2 flex items-start justify-between gap-3 rounded-xl px-2 py-1 text-sm transition-colors"
              >
                <span className="flex min-w-0 items-start gap-2">
                  <span
                    className="mt-1 size-2.5 shrink-0 rounded-full"
                    style={{
                      backgroundColor: PALETTE[index % PALETTE.length],
                    }}
                    aria-hidden
                  />
                  <span className="flex min-w-0 flex-col gap-0.5">
                    <span className="flex items-center gap-2">
                      <span className="font-medium">{position.symbol}</span>
                      <span className="text-muted-foreground hidden truncate sm:inline">
                        {position.instrument}
                      </span>
                      {position.isStale ? (
                        <WarningBadge
                          label={
                            position.quoteDate
                              ? `Desactualizada · ${formatTimeAgo(position.quoteDate)}`
                              : "Desactualizada"
                          }
                          detail={
                            position.quoteDate
                              ? `Última cotización: ${formatDateTime(position.quoteDate)}`
                              : "Cotización desactualizada"
                          }
                        />
                      ) : null}
                    </span>
                    <span className="text-muted-foreground flex items-center gap-1 text-xs tabular-nums">
                      <span>
                        {position.quantity} {position.symbol}
                      </span>
                      {hasQuote ? (
                        <>
                          <span aria-hidden>·</span>
                          <Money
                            value={position.originalValue}
                            currency={position.originalCurrency}
                          />
                        </>
                      ) : (
                        <span>· sin cotización</span>
                      )}
                    </span>
                  </span>
                </span>

                <span className="flex shrink-0 flex-col items-end gap-0.5 tabular-nums">
                  {converted ? (
                    <Money
                      value={position.value}
                      currency={currency}
                      approximate
                      className="text-muted-foreground text-xs"
                    />
                  ) : null}
                  {position.profitLossPct !== null ? (
                    <span
                      className={cn(
                        "text-xs",
                        profitPositive ? "text-success" : "text-destructive",
                      )}
                    >
                      {profitPositive ? "+" : ""}
                      {formatPercentPoints(position.profitLossPct)}
                    </span>
                  ) : null}
                </span>
              </Link>
            </li>
          );
        })}
      </ul>

      <div className="flex items-center justify-between gap-2 border-t pt-3">
        {staleQuotes > 0 ? (
          <span className="text-warning text-xs">
            {staleQuotes} cotización{staleQuotes > 1 ? "es" : ""} desactualizada
            {staleQuotes > 1 ? "s" : ""}
          </span>
        ) : (
          <span className="text-muted-foreground text-xs">
            Cotizaciones al día
          </span>
        )}
      </div>
    </div>
  );
};
