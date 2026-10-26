"use client";

import { TriangleAlert } from "lucide-react";
import { CategoryDonut } from "@/app/(app)/dashboard/_components/charts/category-donut";
import { IncomeExpenseChart } from "@/app/(app)/dashboard/_components/charts/income-expense-chart";
import { EmptyState } from "@/components/common/empty-state";
import { PageHeader } from "@/components/common/page-header";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { NetWorthHero } from "@/app/(app)/dashboard/_components/net-worth-hero";
import { usePeriod } from "@/hooks/use-period";
import { CURRENCY } from "@/lib/format";
import { useDashboard } from "@/lib/query/dashboard";
import { AccountsSection } from "./components/accounts-section";
import { PeriodSelector } from "./components/period-selector";
import { WidgetCard } from "./components/widget-card";

export const DashboardView = () => {
  const { range } = usePeriod();
  const dashboardQuery = useDashboard({ from: range.from, to: range.to });
  const data = dashboardQuery.data;

  return (
    <div className="flex flex-col gap-6">
      <PageHeader title="Tu resumen" />

      <PeriodSelector />

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
        <div className="grid gap-6 lg:grid-cols-3">
          <Skeleton className="h-64 w-full lg:col-span-2" />
          <Skeleton className="h-64 w-full" />
        </div>
      ) : (
        <div className="flex flex-col gap-6">
          <NetWorthHero
            value={data.kpis.netWorth}
            deltaPct={data.kpis.netWorthDeltaPct}
            currency={CURRENCY}
            series={data.netWorthSeries}
            income={data.kpis.income}
            expenses={data.kpis.expenses}
            savings={data.kpis.savings}
          />
          <div className="grid gap-6 lg:grid-cols-2">
            <WidgetCard title="Ingresos vs. gastos" hint="Comparación mensual.">
              <IncomeExpenseChart
                data={data.incomeExpenseByMonth}
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
