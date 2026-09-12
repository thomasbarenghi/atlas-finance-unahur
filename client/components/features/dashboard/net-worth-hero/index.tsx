import { TrendingDown, TrendingUp } from "lucide-react";
import { Area, AreaChart } from "recharts";
import { ChartContainer, type ChartConfig } from "@/components/ui/chart";
import { cn } from "@/lib/utils";
import { formatCurrency, formatPercent } from "@/lib/format";
import { buildPeriodSummaryStats } from "@/lib/period-stats";

export interface NetWorthHeroProps {
  value: number;
  deltaPct: number | null;
  currency: string;
  series: { date: string; value: number }[];
  income: number;
  expenses: number;
  savings: number;
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
}: NetWorthHeroProps) => {
  const hasDelta = deltaPct !== null;
  const positive = (deltaPct ?? 0) >= 0;
  const DeltaIcon = positive ? TrendingUp : TrendingDown;

  return (
    <div className="from-primary/15 via-background to-background relative flex flex-col overflow-hidden rounded-3xl border bg-gradient-to-br p-6">
      <div className="flex flex-col gap-2">
        <span className="text-muted-foreground text-sm">Patrimonio neto</span>
        <span className="font-heading text-3xl font-semibold tracking-tight tabular-nums sm:text-4xl">
          {formatCurrency(value, currency)}
        </span>
        {hasDelta ? (
          <span
            className={cn(
              "flex w-fit items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium",
              positive
                ? "bg-success/10 text-success"
                : "bg-destructive/10 text-destructive",
            )}
          >
            <DeltaIcon className="size-3.5" aria-hidden />
            {positive ? "+" : ""}
            {formatPercent((deltaPct ?? 0) / 100)} vs. período anterior
          </span>
        ) : null}
      </div>

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
            <Area
              dataKey="value"
              type="monotone"
              stroke="var(--chart-1)"
              strokeWidth={2}
              fill="url(#netWorthHeroFill)"
            />
          </AreaChart>
        </ChartContainer>
      </div>
    </div>
  );
};
