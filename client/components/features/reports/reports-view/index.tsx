"use client";

import { useMemo, useState, type ReactNode } from "react";
import Link from "next/link";
import { Check, LayoutGrid, Pencil, Wallet } from "lucide-react";
import { CategoryDonut } from "@/components/charts/category-donut";
import { IncomeExpenseChart } from "@/components/charts/income-expense-chart";
import { EmptyState } from "@/components/common/empty-state";
import { PageHeader } from "@/components/common/page-header";
import { PeriodCurrencyFilters } from "@/components/common/period-currency-filters";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { BudgetUsage } from "@/components/features/dashboard/budget-usage";
import { NetWorthHero } from "@/components/features/dashboard/net-worth-hero";
import { WidgetPicker } from "@/components/features/dashboard/widget-picker";
import { HighlightsCard } from "@/components/features/reports/highlights-card";
import { ReportsSummary } from "@/components/features/reports/reports-summary";
import { ReportsTabs } from "@/components/features/reports/reports-tabs";
import { WidgetCard } from "@/components/features/reports/widget-card";
import { useDashboardLayout } from "@/hooks/use-dashboard-layout";
import { useDisplayCurrency } from "@/hooks/use-display-currency";
import { useMediaQuery } from "@/hooks/use-media-query";
import { usePeriod } from "@/hooks/use-period";
import {
  DASHBOARD_WIDGETS,
  type DashboardWidgetId,
} from "@/lib/dashboard-widgets";
import { formatMonthName } from "@/lib/format";
import { describePeriod } from "@/lib/period";
import { useDashboard } from "@/lib/query/dashboard";
import { WidgetsBoard } from "./components/widgets-board";

const ReportsSkeleton = () => (
  <div className="flex flex-col gap-6">
    <Skeleton className="h-8 w-40" />
    <div className="grid gap-6 lg:grid-cols-3">
      <Skeleton className="h-56 w-full lg:col-span-2" />
      <Skeleton className="h-56 w-full" />
    </div>
    <Skeleton className="h-96 w-full" />
    <div className="grid gap-6 lg:grid-cols-2">
      <Skeleton className="h-72 w-full" />
      <Skeleton className="h-72 w-full" />
    </div>
  </div>
);

export const ReportsView = () => {
  const { range, preset } = usePeriod();
  const { currency } = useDisplayCurrency();

  const {
    layout,
    move,
    swap,
    placeAt,
    setSpan,
    setVisible,
    toggleVisible,
    reset,
  } = useDashboardLayout();

  const isLg = useMediaQuery("(min-width: 1024px)");
  const isXl = useMediaQuery("(min-width: 1280px)");
  const columnCount = isXl ? 3 : isLg ? 2 : 1;

  const [editing, setEditing] = useState(false);
  const [pickerOpen, setPickerOpen] = useState(false);

  const dashboardQuery = useDashboard({
    from: range.from,
    to: range.to,
    currency,
  });

  const orderedIds = useMemo(() => {
    if (columnCount === 1) {
      return DASHBOARD_WIDGETS.map((widget) => widget.id).filter(
        (id) => !layout.hidden.includes(id),
      );
    }
    return layout.columns.flat();
  }, [layout, columnCount]);

  const data = dashboardQuery.data;

  if (dashboardQuery.isLoading || !data) {
    return <ReportsSkeleton />;
  }

  const isEmpty =
    data.kpis.netWorth === 0 &&
    data.expensesByCategory.length === 0 &&
    data.incomeExpenseByMonth.every(
      (month) => month.income === 0 && month.expenses === 0,
    );

  if (isEmpty) {
    return (
      <div className="flex flex-col gap-6">
        <PageHeader
          title="Reportes"
          description="Indicadores, gráficos y alertas de tu período."
        />
        <EmptyState
          icon={Wallet}
          title="Todavía no hay datos"
          description="Cargá tu primera cuenta y registrá un movimiento para ver tus indicadores."
          action={
            <Button asChild>
              <Link href="/dashboard">Cargar mi primera cuenta</Link>
            </Button>
          }
        />
      </div>
    );
  }

  const budgetPeriod = `${range.to.slice(0, 7)}-01`;

  const widgetContent: Record<DashboardWidgetId, ReactNode> = {
    netWorth: (
      <NetWorthHero
        value={data.kpis.netWorth}
        deltaPct={data.kpis.netWorthDeltaPct}
        currency={currency}
        series={data.netWorthSeries}
        income={data.kpis.income}
        expenses={data.kpis.expenses}
        savings={data.kpis.savings}
        showPeriodStats={false}
      />
    ),
    incomeExpense: (
      <WidgetCard title="Ingresos vs. gastos" hint="Comparación mensual.">
        <IncomeExpenseChart
          data={data.incomeExpenseByMonth}
          currency={currency}
        />
      </WidgetCard>
    ),
    categoryDonut: (
      <WidgetCard title="Gastos por categoría" hint="Distribución del gasto.">
        <CategoryDonut data={data.expensesByCategory} currency={currency} />
      </WidgetCard>
    ),
    budgetUsage: (
      <WidgetCard
        title={`Presupuesto de ${formatMonthName(budgetPeriod)}`}
        hint="Mes actual · no depende del período global."
      >
        <BudgetUsage period={budgetPeriod} />
      </WidgetCard>
    ),
  };

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Reportes"
        description={describePeriod(preset, range)}
        actions={
          <div className="flex gap-2">
            <Button
              variant="outline"
              aria-label="Widgets"
              onClick={() => setPickerOpen(true)}
            >
              <LayoutGrid /> <span className="hidden sm:inline">Widgets</span>
            </Button>
            <Button
              variant={editing ? "default" : "outline"}
              aria-label={editing ? "Listo" : "Editar"}
              className="hidden md:inline-flex"
              onClick={() => setEditing((previous) => !previous)}
            >
              {editing ? (
                <>
                  <Check /> <span className="hidden sm:inline">Listo</span>
                </>
              ) : (
                <>
                  <Pencil /> <span className="hidden sm:inline">Editar</span>
                </>
              )}
            </Button>
          </div>
        }
      />

      <ReportsTabs />

      <PeriodCurrencyFilters />

      <ReportsSummary
        income={data.kpis.income}
        expenses={data.kpis.expenses}
        savings={data.kpis.savings}
        incomeDeltaPct={data.kpis.incomeDeltaPct}
        expensesDeltaPct={data.kpis.expensesDeltaPct}
        savingsDeltaPct={data.kpis.savingsDeltaPct}
        savingsRateDeltaPp={data.kpis.savingsRateDeltaPp}
        currency={currency}
      />

      {orderedIds.length === 0 ? (
        <EmptyState
          icon={LayoutGrid}
          title="No hay widgets visibles"
          description="Activá los que quieras ver con el botón Widgets."
          action={
            <Button onClick={() => setPickerOpen(true)}>
              <LayoutGrid /> Elegir widgets
            </Button>
          }
        />
      ) : (
        <WidgetsBoard
          orderedIds={orderedIds}
          layout={layout}
          columnCount={columnCount}
          editing={editing}
          widgetContent={widgetContent}
          onMove={move}
          onSetSpan={setSpan}
          onToggleVisible={toggleVisible}
          onPlaceAt={placeAt}
          onSwap={swap}
        />
      )}

      <HighlightsCard
        categoryChanges={data.categoryChanges}
        expensesDeltaPct={data.kpis.expensesDeltaPct}
        savingsDeltaPct={data.kpis.savingsDeltaPct}
        currency={currency}
      />

      <WidgetPicker
        open={pickerOpen}
        onOpenChange={setPickerOpen}
        layout={layout}
        onSetVisible={setVisible}
        onReset={reset}
      />
    </div>
  );
};
