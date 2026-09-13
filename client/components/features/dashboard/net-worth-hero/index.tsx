import { Area, AreaChart, XAxis, YAxis } from "recharts";
import { TrendBadge } from "@/components/common/trend-badge";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart";
import type { DashboardData } from "@/lib/api/types";
import { computeChartDomain } from "@/lib/chart-scale";
import { formatCurrency, formatDate } from "@/lib/format";
import { buildPeriodSummaryStats } from "@/lib/period-stats";
import { cn } from "@/lib/utils";

export interface NetWorthHeroProps {
  value: number;
  deltaPct: number | null;
  currency: string;
  series: DashboardData["netWorthSeries"];
  income: number;
  expenses: number;
  savings: number;
  showPeriodStats?: boolean;
}

const config = {
  value: { label: "Patrimonio", color: "var(--chart-1)" },
} satisfies ChartConfig;

export const NetWorthHero = ({
  value,
  deltaPct,
  currency,
  series,
  income,
  expenses,
  savings,
  showPeriodStats = true,
}: NetWorthHeroProps) => {
  const [domainMin, domainMax] = computeChartDomain(
    series.map((point) => point.value),
  );

  return (
    <div className="from-primary/15 via-background to-background relative flex flex-col overflow-hidden rounded-3xl border bg-gradient-to-br p-6">
      <div className="flex flex-col gap-2">
        <span className="text-muted-foreground text-sm">Patrimonio neto</span>
        <span className="font-heading text-3xl font-semibold tracking-tight tabular-nums sm:text-4xl">
          {formatCurrency(value, currency)}
        </span>
        <TrendBadge deltaPct={deltaPct} label="vs. período anterior" />
      </div>

      {showPeriodStats ? (
        <div className="mt-4 grid grid-cols-2 gap-4 md:grid-cols-4">
          {buildPeriodSummaryStats(income, expenses, savings, currency).map(
            (stat) => (
              <div
                key={stat.label}
                className="flex min-w-0 flex-col gap-0.5"
                title={stat.hint}
              >
                <span className="text-muted-foreground text-xs">
                  {stat.label}
                </span>
                <span
                  className={cn(
                    "font-heading text-sm font-semibold break-words tabular-nums sm:text-base",
                    stat.tone,
                  )}
                >
                  {stat.display}
                </span>
              </div>
            ),
          )}
        </div>
      ) : null}

      <div className="mt-auto h-24 pt-4">
        <ChartContainer config={config} className="h-24 w-full">
          <AreaChart
            data={series}
            accessibilityLayer
            role="img"
            aria-label="Evolución del patrimonio neto"
          >
            <defs>
              <linearGradient id="netWorthHeroFill" x1="0" y1="0" x2="0" y2="1">
                <stop
                  offset="5%"
                  stopColor="var(--chart-1)"
                  stopOpacity={0.5}
                />
                <stop offset="95%" stopColor="var(--chart-1)" stopOpacity={0} />
              </linearGradient>
            </defs>
            <XAxis dataKey="date" hide />
            <YAxis hide domain={[domainMin, domainMax]} />
            <ChartTooltip
              content={
                <ChartTooltipContent
                  labelFormatter={(label) => {
                    const raw = String(label);
                    return raw.length >= 10 ? formatDate(raw) : raw;
                  }}
                  formatter={(value) => formatCurrency(Number(value), currency)}
                />
              }
            />
            <Area
              dataKey="value"
              type="monotone"
              stroke="var(--chart-1)"
              strokeWidth={2}
              fill="url(#netWorthHeroFill)"
              activeDot={{ r: 4 }}
            />
          </AreaChart>
        </ChartContainer>
      </div>
    </div>
  );
};
