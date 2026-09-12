"use client";

import { AssetCompositionChart } from "@/components/charts/asset-composition-chart";
import { AssetEvolutionChart } from "@/components/charts/asset-evolution-chart";
import { PageHeader } from "@/components/common/page-header";
import { PeriodCurrencyFilters } from "@/components/common/period-currency-filters";
import { StatTiles, type StatTile } from "@/components/common/stat-tiles";
import { Skeleton } from "@/components/ui/skeleton";
import { InvestmentsSummary } from "@/components/features/dashboard/investments-summary";
import { WidgetCard } from "@/components/features/reports/widget-card";
import { useDisplayCurrency } from "@/hooks/use-display-currency";
import { usePeriod } from "@/hooks/use-period";
import { formatCurrency } from "@/lib/format";
import { useDashboard } from "@/lib/query/dashboard";

export const InvestmentsReportView = () => {
  const { range } = usePeriod();
  const { currency } = useDisplayCurrency();
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

  const invested = data.kpis.assets + data.investments.totalValue;
  const net = invested - data.kpis.debts;

  const stats: StatTile[] = [
    {
      label: "Activos",
      value: formatCurrency(data.kpis.assets, currency),
      tone: "text-foreground",
    },
    {
      label: "Inversiones",
      value: formatCurrency(data.investments.totalValue, currency),
      tone: "text-foreground",
    },
    {
      label: "Deudas",
      value: formatCurrency(data.kpis.debts, currency),
      tone: "text-destructive",
    },
    {
      label: "Neto",
      value: formatCurrency(net, currency),
      tone: "text-foreground",
    },
  ];

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Inversiones"
        description="Evolución y composición de tu patrimonio."
      />

      <PeriodCurrencyFilters />

      <StatTiles stats={stats} />

      <WidgetCard
        title="Evolución de activos"
        hint="Valuación de tus activos por mes."
      >
        <AssetEvolutionChart
          data={data.assetsValueByMonth}
          currency={currency}
        />
      </WidgetCard>

      <WidgetCard title="Composición de activos" hint="Valor vigente por tipo.">
        <AssetCompositionChart
          data={data.assetsComposition}
          currency={currency}
        />
      </WidgetCard>

      <WidgetCard title="Inversiones" hint="Posiciones y resultado.">
        <InvestmentsSummary
          totalValue={data.investments.totalValue}
          profitLoss={data.investments.profitLoss}
          profitLossPct={data.investments.profitLossPct}
          staleQuotes={data.investments.staleQuotes}
          positions={data.investments.positions}
          currency={currency}
        />
      </WidgetCard>
    </div>
  );
};
