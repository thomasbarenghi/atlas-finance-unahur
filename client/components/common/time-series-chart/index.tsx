"use client";

import { LineChart } from "lucide-react";
import { Area, AreaChart, CartesianGrid, XAxis, YAxis } from "recharts";
import { EmptyState } from "@/components/common/empty-state";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart";
import type { TimeSeriesChartProps } from "./time-series-chart.types";
import { computeSeriesDomain } from "./time-series-chart.utils";

const HEIGHT_CLASS = {
  sm: "h-40",
  md: "h-56",
  lg: "h-72",
} as const;

export const TimeSeriesChart = ({
  data,
  xKey,
  series,
  xFormatter,
  valueFormatter,
  ariaLabel,
  height = "md",
  emptyTitle = "Todavía no hay suficiente historial",
  emptyDescription = "Necesitamos al menos dos puntos de valuación para mostrar la evolución.",
}: TimeSeriesChartProps) => {
  const hasEnoughData =
    data.length >= 2 &&
    data.some((row) => series.some((item) => Number(row[item.dataKey]) !== 0));

  if (!hasEnoughData) {
    return (
      <EmptyState
        icon={LineChart}
        title={emptyTitle}
        description={emptyDescription}
      />
    );
  }

  const config = series.reduce<ChartConfig>((accumulator, item) => {
    accumulator[item.dataKey] = { label: item.label, color: item.color };
    return accumulator;
  }, {});

  const [domainMin, domainMax] = computeSeriesDomain(
    data,
    series.map((item) => item.dataKey),
  );

  return (
    <ChartContainer
      config={config}
      className={`${HEIGHT_CLASS[height]} w-full`}
      role="img"
      aria-label={ariaLabel}
    >
      <AreaChart data={data} accessibilityLayer>
        <defs>
          {series.map((item) => (
            <linearGradient
              key={item.dataKey}
              id={`timeSeries-${item.dataKey}`}
              x1="0"
              y1="0"
              x2="0"
              y2="1"
            >
              <stop offset="5%" stopColor={item.color} stopOpacity={0.35} />
              <stop offset="95%" stopColor={item.color} stopOpacity={0} />
            </linearGradient>
          ))}
        </defs>
        <CartesianGrid vertical={false} />
        <XAxis
          dataKey={xKey}
          tickFormatter={xFormatter}
          tickLine={false}
          axisLine={false}
          minTickGap={24}
        />
        <YAxis hide domain={[domainMin, domainMax]} />
        <ChartTooltip
          content={
            <ChartTooltipContent
              labelFormatter={(label) =>
                xFormatter ? xFormatter(String(label)) : String(label)
              }
              formatter={(value) => valueFormatter(Number(value))}
            />
          }
        />
        {series.map((item) => (
          <Area
            key={item.dataKey}
            dataKey={item.dataKey}
            type="monotone"
            stroke={item.color}
            strokeWidth={2}
            fill={`url(#timeSeries-${item.dataKey})`}
            dot={false}
            activeDot={{ r: 4 }}
          />
        ))}
      </AreaChart>
    </ChartContainer>
  );
};
