"use client";

import { ChartDataTable } from "@/components/common/chart-data-table";
import type { AssetType } from "@/lib/api/types";
import { formatCurrency, formatPercent } from "@/lib/format";
import { ASSET_TYPE_LABELS } from "@/lib/labels";

export interface AssetCompositionChartProps {
  data: { type: AssetType; value: number }[];
  currency: string;
}

const BAR_COLORS = [
  "var(--chart-2)",
  "var(--chart-1)",
  "var(--chart-3)",
  "var(--chart-4)",
  "var(--chart-5)",
];

export const AssetCompositionChart = ({
  data,
  currency,
}: AssetCompositionChartProps) => {
  const rows = [...data].sort((first, second) => second.value - first.value);
  const total = rows.reduce((sum, row) => sum + row.value, 0);

  if (rows.length === 0) {
    return (
      <p className="text-muted-foreground text-sm">
        Todavía no hay activos valuados en el período.
      </p>
    );
  }

  return (
    <div
      className="flex flex-col gap-3"
      role="img"
      aria-label="Composición de activos por tipo"
    >
      {rows.map((row, index) => (
        <div key={row.type} className="flex flex-col gap-1">
          <div className="flex items-center justify-between gap-2 text-sm">
            <span>{ASSET_TYPE_LABELS[row.type]}</span>
            <span className="text-muted-foreground tabular-nums">
              {formatCurrency(row.value, currency)}
              {total > 0 ? ` · ${formatPercent(row.value / total)}` : ""}
            </span>
          </div>
          <div className="bg-muted h-2 w-full overflow-hidden rounded-full">
            <div
              className="h-full rounded-full"
              style={{
                width: total > 0 ? `${(row.value / total) * 100}%` : "0%",
                backgroundColor: BAR_COLORS[index % BAR_COLORS.length],
              }}
            />
          </div>
        </div>
      ))}

      <ChartDataTable
        caption="Composición de activos por tipo"
        headers={["Tipo", "Valor"]}
        rows={rows.map((row) => ({
          key: row.type,
          cells: [
            ASSET_TYPE_LABELS[row.type],
            formatCurrency(row.value, currency),
          ],
        }))}
      />
    </div>
  );
};
