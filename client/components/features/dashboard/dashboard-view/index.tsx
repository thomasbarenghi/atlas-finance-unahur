"use client";

import { CategoryDonut } from "@/components/charts/category-donut";
import { IncomeExpenseChart } from "@/components/charts/income-expense-chart";
import { ErrorState } from "@/components/common/error-state";
import { PageHeader } from "@/components/common/page-header";
import { PeriodSelector } from "@/components/common/period-selector";
import { Skeleton } from "@/components/ui/skeleton";
import { AccountsSection } from "@/components/features/dashboard/accounts-section";
import { NetWorthHero } from "@/components/features/dashboard/net-worth-hero";
import { WidgetCard } from "@/components/features/dashboard/widget-card";
import { useDisplayCurrency } from "@/hooks/use-display-currency";
import { usePeriod } from "@/hooks/use-period";
import { useDashboard } from "@/lib/query/dashboard";

export const DashboardView = () => {
  const { range } = usePeriod();
  const { currency } = useDisplayCurrency();
  const dashboardQuery = useDashboard({ from: range.from, to: range.to });
  const data = dashboardQuery.data;

  return (
    <div className="flex flex-col gap-6">
      <PageHeader title="Tu resumen" />

      <PeriodSelector />

      {dashboardQuery.isError ? (
        <ErrorState onRetry={() => dashboardQuery.refetch()} />
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
            currency={currency}
            series={data.netWorthSeries}
            income={data.kpis.income}
            expenses={data.kpis.expenses}
            savings={data.kpis.savings}
          />
          <div className="grid gap-6 lg:grid-cols-2">
            <WidgetCard title="Ingresos vs. gastos" hint="Comparación mensual.">
              <IncomeExpenseChart
                data={data.incomeExpenseByMonth}
                currency={currency}
              />
            </WidgetCard>
            <WidgetCard
              title="Gastos por categoría"
              hint="Distribución del gasto."
            >
              <CategoryDonut
                data={data.expensesByCategory}
                currency={currency}
              />
            </WidgetCard>
          </div>
        </div>
      )}

      <AccountsSection />
    </div>
  );
};
