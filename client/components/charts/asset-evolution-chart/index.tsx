"use client";

import { Area, AreaChart, CartesianGrid, XAxis } from "recharts";
import { ChartDataTable } from "@/components/common/chart-data-table";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart";
import { formatCurrency, formatMonth } from "@/lib/format";

export interface AssetEvolutionChartProps {
  data: { month: string; value: number }[];
  currency: string;
}

const config = {
  value: { label: "Activos", color: "var(--chart-1)" },
} satisfies ChartConfig;

export const AssetEvolutionChart = ({
  data,
  currency,
}: AssetEvolutionChartProps) => {
  return (
    <>
      <ChartContainer config={config} className="h-56 w-full">
        <AreaChart
          data={data}
          accessibilityLayer
          role="img"
          aria-label="Evolución del valor de los activos"
        >
          <defs>
            <linearGradient id="assetEvolutionFill" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="var(--chart-1)" stopOpacity={0.4} />
              <stop offset="95%" stopColor="var(--chart-1)" stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid vertical={false} />
          <XAxis
            dataKey="month"
            tickFormatter={(value: string) => formatMonth(value)}
            tickLine={false}
            axisLine={false}
          />
          <ChartTooltip
            content={
              <ChartTooltipContent
                formatter={(value) => formatCurrency(Number(value), currency)}
              />
            }
          />
          <Area
            dataKey="value"
            type="monotone"
            stroke="var(--chart-1)"
            strokeWidth={2}
            fill="url(#assetEvolutionFill)"
          />
        </AreaChart>
      </ChartContainer>
      <ChartDataTable
        caption="Evolución del valor de los activos"
        headers={["Mes", "Valor"]}
        rows={data.map((row) => ({
          key: row.month,
          cells: [row.month, formatCurrency(row.value, currency)],
        }))}
      />
    </>
  );
};
