import type { DashboardData } from "@/lib/api/types";
import { MetricInfo } from "@/components/common/metric-info";
import { useMediaQuery } from "@/hooks/use-media-query";
import { formatCurrency } from "@/lib/format";
import { cn } from "@/lib/utils";
import { buildChartTicks } from "./components/chart-ticks";
import { buildPeriodSummaryStats } from "./components/period-stats";
import { NetWorthChart } from "./components/net-worth-chart";
import { TrendBadge } from "./components/trend-badge";

export interface NetWorthHeroProps {
  value: number;
  deltaPct: number | null;
  currency: string;
  breakdown: DashboardData["breakdown"];
  series: DashboardData["netWorthSeries"];
  income: number;
  expenses: number;
  savings: number;
}

export const NetWorthHero = ({
  value,
  deltaPct,
  currency,
  breakdown,
  series,
  income,
  expenses,
  savings,
}: NetWorthHeroProps) => {
  const isDesktop = useMediaQuery("(min-width: 768px)");
  const ticks = buildChartTicks(series, isDesktop);
  const periodStats = buildPeriodSummaryStats(
    income,
    expenses,
    savings,
    currency,
  );
  const primaryBucket = breakdown.find((item) => item.currency === currency);
  const foreignBuckets = breakdown.filter((item) => item.currency !== currency);
  const orderedBreakdown = [
    ...(primaryBucket ? [primaryBucket] : []),
    ...foreignBuckets,
  ];
  const hasMultipleCurrencies = foreignBuckets.length > 0;

  return (
    <div
      className="border-line relative flex flex-col overflow-hidden rounded-[20px] border p-4 pb-[13px] md:rounded-[24px] md:px-[26px] md:pt-6 md:pb-[18px]"
      style={{ backgroundImage: "var(--hero-gradient)" }}
    >
      <span className="text-muted-foreground flex items-center gap-1.5 text-[11px] leading-[15px] md:text-[12.5px] md:leading-[17px]">
        Patrimonio neto
        <MetricInfo
          label="Patrimonio neto"
          formula={
            hasMultipleCurrencies
              ? `Σ (saldo × cotización) en ${currency}`
              : "Σ saldos de todas las cuentas"
          }
          description={
            hasMultipleCurrencies
              ? `Suma de tus cuentas convertidas a ${currency} con la cotización de Ajustes: ${formatCurrency(value, currency)}. Las transferencias entre cuentas no cambian el total.`
              : `Suma del saldo de tus cuentas: ${formatCurrency(value, currency)}. Las transferencias entre cuentas no cambian el total.`
          }
        />
      </span>

      <div className="mt-2.5 flex flex-col gap-2.5 md:mt-4 md:flex-row md:items-center md:gap-3.5">
        <span className="font-heading text-foreground text-[30px] leading-[38px] font-semibold tracking-[-0.9px] tabular-nums md:text-[40px] md:leading-[50px] md:tracking-[-1.2px]">
          {formatCurrency(value, currency)}
        </span>
        <div className="flex flex-wrap items-center gap-2.5 md:gap-3.5">
          <TrendBadge deltaPct={deltaPct} />
          <span className="text-muted-foreground text-[10.5px] leading-[14px] md:text-[11.5px] md:leading-[16px]">
            vs. período anterior
          </span>
        </div>
      </div>

      {hasMultipleCurrencies ? (
        <div className="mt-2.5 flex flex-wrap items-center gap-x-4 gap-y-1.5 md:mt-3.5 md:gap-x-5">
          {orderedBreakdown.map((item) => (
            <span
              key={item.currency}
              className="flex items-baseline gap-1.5 text-[10.5px] leading-[15px] md:text-[12px] md:leading-[17px]"
            >
              <span className="text-muted-foreground font-semibold tracking-[0.08em]">
                {item.currency}
              </span>
              <span className="text-ink font-semibold tabular-nums">
                {formatCurrency(item.balance, item.currency)}
              </span>
              {item.currency !== currency ? (
                <span className="text-muted-foreground tabular-nums">
                  ≈ {formatCurrency(item.converted, currency)}
                </span>
              ) : null}
            </span>
          ))}
        </div>
      ) : null}

      <div className="mt-3 md:mt-4">
        <span className="text-muted-foreground text-[9.5px] leading-[13px] font-bold tracking-[0.11em] uppercase md:text-[10px] md:leading-[14px]">
          <span className="hidden md:inline">Indicadores del período</span>
          <span className="md:hidden">Indicadores</span>
        </span>
      </div>

      <div className="mt-1.5 grid grid-cols-2 gap-x-3 gap-y-2.5 md:mt-2 md:grid-cols-4 md:gap-11">
        {periodStats.map((stat) => (
          <div
            key={stat.label}
            className="flex min-w-0 flex-col gap-px md:gap-0.5"
            title={stat.hint}
          >
            <span className="text-muted-foreground flex items-center gap-1 text-[10px] leading-[14px] md:text-[11.5px] md:leading-[16px]">
              {stat.label}
              {stat.info ? (
                <MetricInfo
                  label={stat.label}
                  formula={stat.info.formula}
                  description={stat.info.description}
                />
              ) : null}
            </span>
            <span
              className={cn(
                "font-heading text-[13px] leading-[16px] font-semibold break-words tabular-nums md:text-[16px] md:leading-[20px]",
                stat.tone,
              )}
            >
              {stat.display}
            </span>
          </div>
        ))}
      </div>

      <NetWorthChart
        series={series}
        currency={currency}
        ticks={ticks}
        isDesktop={isDesktop}
      />
    </div>
  );
};
