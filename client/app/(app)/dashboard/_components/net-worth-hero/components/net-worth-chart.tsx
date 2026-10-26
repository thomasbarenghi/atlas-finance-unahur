import {
  Area,
  AreaChart,
  CartesianGrid,
  ReferenceDot,
  XAxis,
  YAxis,
} from "recharts";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart";
import type { DashboardData } from "@/lib/api/types";
import { formatCurrency, formatDate, formatDayMonth } from "@/lib/format";
import { computeChartDomain } from "./chart-scale";

const config = {
  value: { label: "Patrimonio", color: "var(--primary)" },
} satisfies ChartConfig;

export interface NetWorthChartProps {
  series: DashboardData["netWorthSeries"];
  currency: string;
  ticks: string[];
  isDesktop: boolean;
}

export const NetWorthChart = ({
  series,
  currency,
  ticks,
  isDesktop,
}: NetWorthChartProps) => {
  const [domainMin, domainMax] = computeChartDomain(
    series.map((point) => point.value),
  );
  const lastPoint = series.at(-1);

  return (
    <div className="mt-2.5 h-[72px] md:mt-4 md:h-[100px]">
      <ChartContainer config={config} className="h-[72px] w-full md:h-[100px]">
        <AreaChart
          data={series}
          accessibilityLayer
          role="img"
          aria-label="Evolución del patrimonio neto"
        >
          <defs>
            <linearGradient id="netWorthHeroFill" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="var(--primary)" stopOpacity={0.35} />
              <stop offset="95%" stopColor="var(--primary)" stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid vertical={false} stroke="var(--line2)" />
          <XAxis
            dataKey="date"
            ticks={ticks}
            tickFormatter={(value: string) => formatDayMonth(value)}
            tickLine={false}
            axisLine={false}
            tick={{
              fontSize: isDesktop ? 10 : 9.5,
              fill: "var(--muted-foreground)",
            }}
            tickMargin={11}
            height={24}
            interval={0}
            padding={{ left: 20, right: 20 }}
          />
          <YAxis hide width={0} domain={[domainMin, domainMax]} />
          <ChartTooltip
            content={
              <ChartTooltipContent
                labelFormatter={(label) => {
                  const raw = String(label);
                  return raw.length >= 10 ? formatDate(raw) : raw;
                }}
                formatter={(nextValue) =>
                  formatCurrency(Number(nextValue), currency)
                }
              />
            }
          />
          <Area
            dataKey="value"
            type="monotone"
            stroke="var(--primary)"
            strokeWidth={2}
            fill="url(#netWorthHeroFill)"
            activeDot={{ r: 4 }}
            isAnimationActive={false}
          />
          {lastPoint ? (
            <ReferenceDot
              x={lastPoint.date}
              y={lastPoint.value}
              r={4}
              fill="var(--primary)"
              stroke="var(--card)"
              strokeWidth={2}
            />
          ) : null}
        </AreaChart>
      </ChartContainer>
    </div>
  );
};
