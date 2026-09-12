export interface TimeSeriesDefinition {
  dataKey: string;
  label: string;
  color: string;
}

export interface TimeSeriesChartProps {
  data: Record<string, string | number>[];
  xKey: string;
  series: TimeSeriesDefinition[];
  xFormatter?: (value: string) => string;
  valueFormatter: (value: number) => string;
  ariaLabel: string;
  height?: "sm" | "md" | "lg";
  emptyTitle?: string;
  emptyDescription?: string;
}
