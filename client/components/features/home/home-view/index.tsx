"use client";

import { PageHeader } from "@/components/common/page-header";
import { PeriodCurrencyFilters } from "@/components/common/period-currency-filters";
import { NetWorthHero } from "@/components/features/dashboard/net-worth-hero";
import { AccountsSection } from "@/components/features/home/accounts-section";
import { InvestmentsSection } from "@/components/features/home/investments-section";
import { QuickAccess } from "@/components/features/home/quick-access";
import { Skeleton } from "@/components/ui/skeleton";
import { useDisplayCurrency } from "@/hooks/use-display-currency";
import { usePeriod } from "@/hooks/use-period";
import { useDashboard } from "@/lib/query/dashboard";

export const HomeView = () => {
  const { range } = usePeriod();
  const { currency } = useDisplayCurrency();

  const dashboardQuery = useDashboard({
    from: range.from,
    to: range.to,
    currency,
  });

  const data = dashboardQuery.data;

  return (
    <div className="flex flex-col gap-6">
      <PageHeader title="Tu resumen" />

      <PeriodCurrencyFilters />

      {dashboardQuery.isLoading || !data ? (
        <Skeleton className="h-56 w-full" />
      ) : (
        <NetWorthHero
          value={data.kpis.netWorth}
          deltaPct={data.kpis.netWorthDeltaPct}
          currency={currency}
          series={data.netWorthSeries}
          income={data.kpis.income}
          expenses={data.kpis.expenses}
          savings={data.kpis.savings}
        />
      )}

      <QuickAccess />

      <AccountsSection />

      <InvestmentsSection />
    </div>
  );
};
