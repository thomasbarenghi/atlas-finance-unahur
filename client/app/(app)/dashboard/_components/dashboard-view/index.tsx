"use client";

import { TriangleAlert } from "lucide-react";
import { CategoryDonut } from "@/app/(app)/dashboard/_components/charts/category-donut";
import { IncomeExpenseChart } from "@/app/(app)/dashboard/_components/charts/income-expense-chart";
import { EmptyState } from "@/components/common/empty-state";
import { PageHeader } from "@/components/common/page-header";
import { Button } from "@/components/ui/button";
import { NetWorthHero } from "@/app/(app)/dashboard/_components/net-worth-hero";
import { useMediaQuery } from "@/hooks/use-media-query";
import { usePeriod } from "@/hooks/use-period";
import { CURRENCY } from "@/lib/format";
import { useDashboard } from "@/lib/query/dashboard";
import { AccountsSection } from "./components/accounts-section";
import { HeaderActions } from "./components/header-actions";
import { PeriodSelector } from "@/components/common/period-selector";
import { DashboardSkeleton } from "./components/dashboard-skeleton";
import { WidgetCard } from "./components/widget-card";
import { buildBarsHint, buildPeriodLabel } from "./components/period-summary";

export const DashboardView = () => {
  const isDesktop = useMediaQuery("(min-width: 768px)");
  const { preset, range } = usePeriod();
  const dashboardQuery = useDashboard({ from: range.from, to: range.to });
  const data = dashboardQuery.data;
  const periodLabel = buildPeriodLabel(range);
  const barsHint = buildBarsHint(data, preset, range);

  return (
    <div className="flex flex-col gap-4 md:gap-[22px]">
      <PageHeader
        title="Tu resumen"
        description={isDesktop ? periodLabel : undefined}
        titleAddon={
          isDesktop ? null : (
            <span className="ml-auto">
              <PeriodSelector />
            </span>
          )
        }
        actions={isDesktop ? <HeaderActions /> : undefined}
      />

      {dashboardQuery.isError ? (
        <EmptyState
          icon={TriangleAlert}
          title="No pudimos cargar la información"
          description="Revisá tu conexión e intentá de nuevo."
          action={
            <Button variant="outline" onClick={() => dashboardQuery.refetch()}>
              Reintentar
            </Button>
          }
        />
      ) : dashboardQuery.isLoading || !data ? (
        <DashboardSkeleton />
      ) : (
        <div className="flex flex-col gap-4 md:gap-[22px]">
          <NetWorthHero
            value={data.kpis.netWorth}
            deltaPct={data.kpis.netWorthDeltaPct}
            currency={CURRENCY}
            series={data.netWorthSeries}
            income={data.kpis.income}
            expenses={data.kpis.expenses}
            savings={data.kpis.savings}
          />
          <div className="grid gap-4 md:gap-[22px] lg:grid-cols-[700fr_378fr]">
            <WidgetCard
              title="Ingresos vs. gastos"
              hint={
                <>
                  <span className="hidden md:inline">{barsHint.desktop}</span>
                  <span className="md:hidden">{barsHint.mobile}</span>
                </>
              }
            >
              <IncomeExpenseChart
                data={data.incomeExpenseByPeriod}
                currency={CURRENCY}
              />
            </WidgetCard>
            <WidgetCard
              title="Gastos por categoría"
              hint="Distribución del gasto."
            >
              <CategoryDonut
                data={data.expensesByCategory}
                currency={CURRENCY}
              />
            </WidgetCard>
          </div>
        </div>
      )}

      <AccountsSection />
    </div>
  );
};
