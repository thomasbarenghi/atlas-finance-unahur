import Link from "next/link";
import {
  ArrowUpRight,
  TrendingDown,
  TrendingUp,
  TriangleAlert,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { formatCurrency, formatPercent } from "@/lib/format";

export interface InvestmentPositionSummary {
  symbol: string;
  instrument: string;
  value: number;
  profitLossPct: number | null;
  isStale: boolean;
}

export interface InvestmentsSummaryProps {
  totalValue: number;
  profitLoss: number;
  profitLossPct: number;
  staleQuotes: number;
  positions: InvestmentPositionSummary[];
  currency: string;
}

const PALETTE = [
  "var(--chart-1)",
  "var(--chart-2)",
  "var(--chart-3)",
  "var(--chart-4)",
  "var(--chart-5)",
];

export const InvestmentsSummary = ({
  totalValue,
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
      <div className="flex h-full flex-col justify-center gap-2">
        <span className="text-muted-foreground text-sm">
          Todavía no tenés inversiones cargadas.
        </span>
        <Link
          href="/dashboard"
          className="text-primary w-fit text-sm hover:underline"
        >
          Cargar una posición
        </Link>
      </div>
    );
  }

  return (
    <div className="flex h-full flex-col gap-4">
      <div className="flex flex-col gap-1">
        <span className="text-muted-foreground text-sm">Inversiones</span>
        <span className="font-heading text-2xl font-semibold tabular-nums">
          {formatCurrency(totalValue, currency)}
        </span>
        <span
          className={cn(
            "flex w-fit items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium",
            positive
              ? "bg-success/10 text-success"
              : "bg-destructive/10 text-destructive",
          )}
        >
          <ProfitIcon className="size-3.5" aria-hidden />
          {positive ? "+" : "−"}
          {formatCurrency(Math.abs(profitLoss), currency)} ·{" "}
          {profitLossPct >= 0 ? "+" : ""}
          {formatPercent(profitLossPct / 100)}
        </span>
      </div>

      <div className="flex h-3 w-full overflow-hidden rounded-full">
        {positions.map((position, index) => (
          <div
            key={position.symbol}
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

      <ul className="flex flex-col gap-2">
        {positions.slice(0, 4).map((position, index) => (
          <li
            key={position.symbol}
            className="flex items-center justify-between gap-2 text-sm"
          >
            <span className="flex items-center gap-2">
              <span
                className="size-2.5 rounded-full"
                style={{
                  backgroundColor: PALETTE[index % PALETTE.length],
                }}
                aria-hidden
              />
              <span className="font-medium">{position.symbol}</span>
              <span className="text-muted-foreground hidden truncate sm:inline">
                {position.instrument}
              </span>
              {position.isStale ? (
                <TriangleAlert
                  className="text-warning size-3.5"
                  aria-label="Cotización desactualizada"
                />
              ) : null}
            </span>
            <span className="flex items-center gap-2 tabular-nums">
              <span className="text-muted-foreground">
                {formatCurrency(position.value, currency)}
              </span>
              {position.profitLossPct !== null ? (
                <span
                  className={cn(
                    "w-14 text-right text-xs",
                    position.profitLossPct >= 0
                      ? "text-success"
                      : "text-destructive",
                  )}
                >
                  {position.profitLossPct >= 0 ? "+" : ""}
                  {formatPercent(position.profitLossPct / 100)}
                </span>
              ) : null}
            </span>
          </li>
        ))}
      </ul>

      <div className="mt-auto flex items-center justify-between gap-2 border-t pt-3">
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
        <Link
          href="/dashboard"
          className="text-primary flex items-center gap-1 text-xs hover:underline"
        >
          Ver inversiones <ArrowUpRight className="size-3.5" />
        </Link>
      </div>
    </div>
  );
};
