import { ChartDataTable } from "@/components/common/chart-data-table";
import { formatCurrency, formatPercent } from "@/lib/format";
import type { AllocationListProps } from "./allocation-list.types";

const DEFAULT_COLORS = [
  "var(--chart-2)",
  "var(--chart-1)",
  "var(--chart-3)",
  "var(--chart-4)",
  "var(--chart-5)",
];

export const AllocationList = ({
  items,
  currency,
  total,
  caption,
  emptyMessage = "Todavía no hay información para este período.",
}: AllocationListProps) => {
  const rows = [...items].sort((first, second) => second.value - first.value);
  const resolvedTotal = total ?? rows.reduce((sum, row) => sum + row.value, 0);

  if (rows.length === 0 || resolvedTotal <= 0) {
    return <p className="text-muted-foreground text-sm">{emptyMessage}</p>;
  }

  return (
    <div className="flex flex-col gap-3">
      {rows.map((row, index) => {
        const color =
          row.color ?? DEFAULT_COLORS[index % DEFAULT_COLORS.length];
        const share = row.value > 0 ? row.value / resolvedTotal : 0;
        return (
          <div key={row.key} className="flex flex-col gap-1">
            <div className="flex items-center justify-between gap-2 text-sm">
              <span className="flex items-center gap-2">
                <span
                  className="size-2.5 rounded-full"
                  style={{ backgroundColor: color }}
                  aria-hidden
                />
                {row.label}
              </span>
              <span className="text-muted-foreground tabular-nums">
                {formatCurrency(row.value, currency)}
                {share > 0 ? ` · ${formatPercent(share)}` : ""}
              </span>
            </div>
            {share > 0 ? (
              <div className="bg-muted h-2 w-full overflow-hidden rounded-full">
                <div
                  className="h-full rounded-full"
                  style={{ width: `${share * 100}%`, backgroundColor: color }}
                />
              </div>
            ) : null}
          </div>
        );
      })}

      {caption ? (
        <ChartDataTable
          caption={caption}
          headers={["Concepto", "Valor"]}
          rows={rows.map((row) => ({
            key: row.key,
            cells: [row.label, formatCurrency(row.value, currency)],
          }))}
        />
      ) : null}
    </div>
  );
};
