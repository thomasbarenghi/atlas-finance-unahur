import { PieChart as PieChartIcon } from "lucide-react";
import { Cell, Pie, PieChart } from "recharts";
import { ChartDataTable } from "@/components/common/chart-data-table";
import { EmptyState } from "@/components/common/empty-state";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart";
import { useMediaQuery } from "@/hooks/use-media-query";
import { formatCurrency, formatPercent } from "@/lib/format";
import { groupSmallCategories } from "./category-donut.utils";

export interface CategoryDonutProps {
  data: { categoryId: string; name: string; color: string; value: number }[];
  currency: string;
}

export const CategoryDonut = ({ data, currency }: CategoryDonutProps) => {
  const config = {
    value: { label: "Gasto" },
  } satisfies ChartConfig;
  const isDesktop = useMediaQuery("(min-width: 768px)");
  const chartData = groupSmallCategories(data);
  const total = chartData.reduce((sum, item) => sum + item.value, 0);

  if (chartData.length === 0 || total <= 0) {
    return (
      <EmptyState
        icon={PieChartIcon}
        title="Sin gastos en el período"
        description="Cuando registres gastos por categoría vas a ver su distribución."
      />
    );
  }

  return (
    <>
      <ChartContainer
        config={config}
        className="mx-auto h-[132px] w-full md:h-[168px]"
      >
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
            data={chartData}
            dataKey="value"
            nameKey="name"
            innerRadius={isDesktop ? 47 : 38}
            outerRadius={isDesktop ? 79 : 63}
            paddingAngle={2}
            isAnimationActive={false}
          >
            {chartData.map((item) => (
              <Cell key={item.categoryId} fill={item.color} />
            ))}
          </Pie>
        </PieChart>
      </ChartContainer>
      <ul className="mt-1 flex flex-col gap-1 text-[10.5px] md:mt-1.5 md:gap-0 md:text-[11.5px]">
        {chartData.map((item) => (
          <li
            key={item.categoryId}
            className="flex h-6 items-center gap-2 leading-[14px] md:h-[27px] md:leading-[16px]"
          >
            <span
              className="size-[7px] shrink-0 rounded-full md:size-2"
              style={{ backgroundColor: item.color }}
              aria-hidden
            />
            <span className="text-ink2 min-w-0 flex-1 truncate">
              {item.name}
            </span>
            <span className="text-ink2 shrink-0 tabular-nums">
              {formatCurrency(item.value, currency)}
            </span>
            <span className="text-muted-foreground w-9 shrink-0 text-right text-[9.5px] leading-[13px] tabular-nums md:w-11 md:text-[10.5px] md:leading-[14px]">
              {total > 0 ? formatPercent(item.value / total) : ""}
            </span>
          </li>
        ))}
      </ul>
      <ChartDataTable
        caption="Gastos por categoría"
        headers={["Categoría", "Monto"]}
        rows={chartData.map((item) => ({
          key: item.categoryId,
          cells: [item.name, formatCurrency(item.value, currency)],
        }))}
      />
    </>
  );
};
