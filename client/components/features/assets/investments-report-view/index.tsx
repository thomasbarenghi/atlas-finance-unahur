"use client";

import { useState } from "react";
import { AllocationList } from "@/components/common/allocation-list";
import { PageHeader } from "@/components/common/page-header";
import { PeriodCurrencyFilters } from "@/components/common/period-currency-filters";
import { SectionCard } from "@/components/common/section-card";
import { StatTiles, type StatTile } from "@/components/common/stat-tiles";
import { TimeSeriesChart } from "@/components/common/time-series-chart";
import { Skeleton } from "@/components/ui/skeleton";
import { InvestmentsSummary } from "@/components/features/dashboard/investments-summary";
import { ReportsTabs } from "@/components/features/reports/reports-tabs";
import { useDisplayCurrency } from "@/hooks/use-display-currency";
import { usePeriod } from "@/hooks/use-period";
import type { NetWorthCompositionKind } from "@/lib/api/types";
import {
  formatCompactCurrency,
  formatCurrency,
  formatMonth,
} from "@/lib/format";
import { useDashboard } from "@/lib/query/dashboard";
import { cn } from "@/lib/utils";

type EvolutionKey = "value" | "assets" | "debts";

const EVOLUTION_OPTIONS: {
  key: EvolutionKey;
  label: string;
  color: string;
}[] = [
  { key: "value", label: "Patrimonio", color: "var(--chart-1)" },
  { key: "assets", label: "Activos", color: "var(--chart-2)" },
  { key: "debts", label: "Deudas", color: "var(--chart-4)" },
];

const COMPOSITION_COLORS: Record<NetWorthCompositionKind, string> = {
  property: "var(--chart-2)",
  vehicle: "var(--chart-1)",
  asset: "var(--chart-3)",
  investment: "var(--chart-4)",
  cash: "var(--chart-5)",
  account: "var(--chart-1)",
};

export const InvestmentsReportView = () => {
  const { range } = usePeriod();
  const { currency } = useDisplayCurrency();
  const [evolutionKey, setEvolutionKey] = useState<EvolutionKey>("value");

  const dashboardQuery = useDashboard({
    from: range.from,
    to: range.to,
    currency,
  });

  const data = dashboardQuery.data;

  if (dashboardQuery.isLoading || !data) {
    return (
      <div className="flex flex-col gap-6">
        <Skeleton className="h-8 w-40" />
        <Skeleton className="h-20 w-full" />
        <Skeleton className="h-64 w-full rounded-3xl" />
        <Skeleton className="h-56 w-full rounded-3xl" />
      </div>
    );
  }

  const stats: StatTile[] = [
    {
      label: "Activos",
      value: formatCurrency(data.kpis.assets, currency),
      tone: "text-foreground",
      deltaPct: data.kpis.assetsDeltaPct,
      favorable: "up",
    },
    {
      label: "Inversiones financieras",
      value: formatCurrency(data.investments.totalValue, currency),
      tone: "text-foreground",
      deltaPct: data.kpis.investmentsDeltaPct,
      favorable: "up",
    },
    {
      label: "Cuentas",
      value: formatCurrency(data.kpis.accounts, currency),
      tone: data.kpis.accounts < 0 ? "text-destructive" : "text-foreground",
      deltaPct: data.kpis.accountsDeltaPct,
      favorable: "up",
    },
    {
      label: "Deudas",
      value: `−${formatCurrency(data.kpis.debts, currency)}`,
      tone: "text-destructive",
      deltaPct: data.kpis.debtsDeltaPct,
      favorable: "down",
    },
    {
      label: "Patrimonio neto",
      value: formatCurrency(data.kpis.netWorth, currency),
      tone: "text-foreground",
      deltaPct: data.kpis.netWorthDeltaPct,
      favorable: "up",
    },
  ];

  const selectedEvolution =
    EVOLUTION_OPTIONS.find((option) => option.key === evolutionKey) ??
    EVOLUTION_OPTIONS[0];
  const evolutionValues = data.netWorthSeries.map(
    (point) => point[selectedEvolution.key],
  );
  const maxEvolution = evolutionValues.length
    ? Math.max(...evolutionValues)
    : 0;
  const minEvolution = evolutionValues.length
    ? Math.min(...evolutionValues)
    : 0;

  const composition = data.netWorthComposition.map((item) => ({
    key: item.kind,
    label: item.label,
    value: item.value,
    color: COMPOSITION_COLORS[item.kind],
  }));
  const grossAssets =
    data.kpis.assets + data.investments.totalValue + data.kpis.accounts;

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Patrimonio"
        description="Evolución y composición de tu patrimonio."
      />

      <ReportsTabs />

      <PeriodCurrencyFilters />

      <StatTiles stats={stats} />

      <SectionCard
        title="Evolución del patrimonio"
        description="Seleccioná la serie que querés analizar."
        actions={
          <div className="bg-muted flex rounded-full p-0.5">
            {EVOLUTION_OPTIONS.map((option) => (
              <button
                key={option.key}
                type="button"
                onClick={() => setEvolutionKey(option.key)}
                aria-pressed={evolutionKey === option.key}
                className={cn(
                  "rounded-full px-2.5 py-1 text-xs font-medium transition-colors",
                  evolutionKey === option.key
                    ? "bg-background text-foreground shadow-sm"
                    : "text-muted-foreground hover:text-foreground",
                )}
              >
                {option.label}
              </button>
            ))}
          </div>
        }
      >
        <TimeSeriesChart
          data={data.netWorthSeries}
          xKey="date"
          xFormatter={(value) => formatMonth(value)}
          series={[
            {
              dataKey: selectedEvolution.key,
              label: selectedEvolution.label,
              color: selectedEvolution.color,
            },
          ]}
          valueFormatter={(value) => formatCurrency(value, currency)}
          ariaLabel={`Evolución de ${selectedEvolution.label.toLowerCase()}`}
        />
        <div className="text-muted-foreground mt-3 flex items-center justify-between text-xs tabular-nums">
          <span>Máximo: {formatCompactCurrency(maxEvolution, currency)}</span>
          <span>Mínimo: {formatCompactCurrency(minEvolution, currency)}</span>
        </div>
      </SectionCard>

      <SectionCard
        title="Composición de activos"
        description="Distribución del valor bruto de tus activos."
      >
        <AllocationList
          items={composition}
          currency={currency}
          caption="Composición de activos"
        />
        <dl className="mt-4 flex flex-col gap-1 border-t pt-3 text-sm">
          <div className="flex items-center justify-between gap-2">
            <dt className="text-muted-foreground">Activos brutos</dt>
            <dd className="font-medium tabular-nums">
              {formatCurrency(grossAssets, currency)}
            </dd>
          </div>
          <div className="flex items-center justify-between gap-2">
            <dt className="text-muted-foreground">Deudas</dt>
            <dd className="text-destructive font-medium tabular-nums">
              −{formatCurrency(data.kpis.debts, currency)}
            </dd>
          </div>
          <div className="flex items-center justify-between gap-2">
            <dt className="font-medium">Patrimonio neto</dt>
            <dd className="font-heading font-semibold tabular-nums">
              {formatCurrency(data.kpis.netWorth, currency)}
            </dd>
          </div>
        </dl>
      </SectionCard>

      <SectionCard
        title="Inversiones financieras"
        description="Posiciones y resultado."
      >
        <InvestmentsSummary
          totalValue={data.investments.totalValue}
          totalCost={data.investments.totalCost}
          profitLoss={data.investments.profitLoss}
          profitLossPct={data.investments.profitLossPct}
          staleQuotes={data.investments.staleQuotes}
          positions={data.investments.positions}
          currency={currency}
        />
      </SectionCard>
    </div>
  );
};
