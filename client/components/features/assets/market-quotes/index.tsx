"use client";

import { Coins } from "lucide-react";
import { EmptyState } from "@/components/common/empty-state";
import { WarningBadge } from "@/components/common/warning-badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  formatCurrency,
  formatDateTime,
  formatPercentPoints,
  formatTimeAgo,
} from "@/lib/format";
import { cn } from "@/lib/utils";
import { useQuotes } from "@/lib/query/quotes";

export const MarketQuotes = () => {
  const quotesQuery = useQuotes();

  if (quotesQuery.isLoading) {
    return (
      <div className="flex flex-col gap-3">
        {Array.from({ length: 4 }).map((_, index) => (
          <Skeleton key={index} className="h-12 w-full" />
        ))}
      </div>
    );
  }

  const quotes = quotesQuery.data ?? [];

  if (quotes.length === 0) {
    return (
      <EmptyState
        icon={Coins}
        title="Sin cotizaciones disponibles"
        description="El catálogo de mercado todavía no tiene precios para mostrar."
      />
    );
  }

  return (
    <ul className="flex flex-col gap-3">
      {quotes.map((quote) => (
        <li
          key={`${quote.symbol}-${quote.currency}-${quote.provider}`}
          className="flex items-start justify-between gap-3 border-b pb-3 text-sm last:border-b-0 last:pb-0"
        >
          <span className="flex min-w-0 flex-col gap-0.5">
            <span className="flex items-center gap-2">
              <span className="font-medium">{quote.symbol}</span>
              {quote.isStale ? (
                <WarningBadge
                  label={`Desactualizada · ${formatTimeAgo(quote.fetchedAt)}`}
                  detail={`Última actualización: ${formatDateTime(quote.fetchedAt)}`}
                />
              ) : null}
            </span>
            <span className="text-muted-foreground text-xs">
              {quote.provider} · {formatDateTime(quote.fetchedAt)}
            </span>
          </span>

          <span className="flex shrink-0 flex-col items-end gap-0.5 tabular-nums">
            <span className="font-medium">
              {formatCurrency(quote.price, quote.currency)}
            </span>
            {quote.change24h !== null ? (
              <span
                className={cn(
                  "text-xs",
                  quote.change24h >= 0 ? "text-success" : "text-destructive",
                )}
              >
                {quote.change24h >= 0 ? "+" : ""}
                {formatPercentPoints(quote.change24h)}
              </span>
            ) : null}
          </span>
        </li>
      ))}
    </ul>
  );
};
