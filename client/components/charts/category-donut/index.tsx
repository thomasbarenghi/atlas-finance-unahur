import { Cell, Pie, PieChart } from "recharts";
import { ChartDataTable } from "@/components/common/chart-data-table";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart";
import { formatCurrency, formatPercent } from "@/lib/format";

export interface CategoryDonutProps {
  data: { categoryId: string; name: string; color: string; value: number }[];
  currency: string;
}

const config = {
  value: { label: "Gasto" },
} satisfies ChartConfig;

export const CategoryDonut = ({ data, currency }: CategoryDonutProps) => {
  const total = data.reduce((sum, item) => sum + item.value, 0);

  return (
    <>
      <ChartContainer config={config} className="mx-auto h-56 w-full">
        <PieChart
          accessibilityLayer
          role="img"
          aria-label="Gastos por categoría"
        >
          <ChartTooltip
            content={
              <ChartTooltipContent
                hideLabel
                formatter={(value) => formatCurrency(Number(value), currency)}
              />
            }
          />
          <Pie
            data={data}
            dataKey="value"
            nameKey="name"
            innerRadius={55}
            outerRadius={90}
            paddingAngle={2}
          >
            {data.map((item) => (
              <Cell key={item.categoryId} fill={item.color} />
            ))}
          </Pie>
        </PieChart>
      </ChartContainer>
      <ul className="flex flex-col gap-2">
        {data.map((item) => (
          <li
            key={item.categoryId}
            className="flex items-center justify-between gap-2 text-sm"
          >
            <span className="flex items-center gap-2">
              <span
                className="size-2.5 rounded-full"
                style={{ backgroundColor: item.color }}
                aria-hidden
              />
              {item.name}
            </span>
            <span className="text-muted-foreground tabular-nums">
              {formatCurrency(item.value, currency)}
              {total > 0 ? ` · ${formatPercent(item.value / total)}` : ""}
            </span>
          </li>
        ))}
      </ul>
      <ChartDataTable
        caption="Gastos por categoría"
        headers={["Categoría", "Monto"]}
        rows={data.map((item) => ({
          key: item.categoryId,
          cells: [item.name, formatCurrency(item.value, currency)],
        }))}
      />
    </>
  );
};
