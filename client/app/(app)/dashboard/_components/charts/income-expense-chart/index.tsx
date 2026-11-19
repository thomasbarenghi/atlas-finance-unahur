import { BarChart3 } from "lucide-react";
import { Bar, BarChart, CartesianGrid, XAxis } from "recharts";
import { ChartDataTable } from "@/components/common/chart-data-table";
import { EmptyState } from "@/components/common/empty-state";
import {
  ChartContainer,
  ChartTooltip,
  type ChartConfig,
} from "@/components/ui/chart";
import type { DashboardData } from "@/lib/api/types";
import { formatCurrency, formatMonth, formatWeekRange } from "@/lib/format";
import { IncomeExpenseTooltip } from "./components/income-expense-tooltip";

export interface IncomeExpenseChartProps {
  data: DashboardData["incomeExpenseByPeriod"];
  currency: string;
}

const config = {
  income: { label: "Ingresos", color: "var(--data-1)" },
  expenses: { label: "Gastos", color: "var(--data-2)" },
} satisfies ChartConfig;

export const IncomeExpenseChart = ({
  data,
  currency,
}: IncomeExpenseChartProps) => {
  const isWeekly = data[0]?.bucket === "week";
  const chartData = data.map((item) => ({
    key: item.start,
    label:
      item.bucket === "week"
        ? formatWeekRange(item.start, item.end)
        : formatMonth(item.start),
    income: item.income,
    expenses: item.expenses,
  }));
  const isEmpty = chartData.every(
    (row) => row.income === 0 && row.expenses === 0,
  );

  if (chartData.length === 0 || isEmpty) {
    return (
      <EmptyState
        icon={BarChart3}
        title="Sin movimientos en el período"
        description="Registrá ingresos y gastos para comparar su evolución."
      />
    );
  }

  return (
    <>
      <ChartContainer config={config} className="h-[152px] w-full md:h-[192px]">
        <BarChart
          data={chartData}
          accessibilityLayer
          role="img"
          aria-label={`Ingresos y gastos por ${isWeekly ? "semana" : "mes"}`}
          barGap={4}
        >
          <CartesianGrid vertical={false} stroke="var(--line2)" />
          <XAxis
            dataKey="label"
            tickLine={false}
            axisLine={false}
            tick={{ fontSize: 10, fill: "var(--muted-foreground)" }}
          />
          <ChartTooltip
            content={<IncomeExpenseTooltip currency={currency} />}
          />
          <Bar
            dataKey="income"
            fill="var(--data-1)"
            radius={[4, 4, 0, 0]}
            maxBarSize={30}
            isAnimationActive={false}
          />
          <Bar
            dataKey="expenses"
            fill="var(--data-2)"
            radius={[4, 4, 0, 0]}
            maxBarSize={30}
            isAnimationActive={false}
          />
        </BarChart>
      </ChartContainer>
      <div className="mt-2 flex items-center justify-center gap-4 text-[9.5px] leading-[13px] text-muted-foreground md:gap-[18px] md:text-[10.5px] md:leading-[14px]">
        {[
          { label: "Gastos", color: "var(--data-2)" },
          { label: "Ingresos", color: "var(--data-1)" },
        ].map((item) => (
          <span key={item.label} className="flex items-center gap-1.5">
            <span
              className="size-2 shrink-0 rounded-[2px]"
              style={{ backgroundColor: item.color }}
              aria-hidden
            />
            {item.label}
          </span>
        ))}
      </div>
      <ChartDataTable
        caption={`Ingresos y gastos por ${isWeekly ? "semana" : "mes"}`}
        headers={[isWeekly ? "Semana" : "Mes", "Ingresos", "Gastos"]}
        rows={chartData.map((row) => ({
          key: row.key,
          cells: [
            row.label,
            formatCurrency(row.income, currency),
            formatCurrency(row.expenses, currency),
          ],
        }))}
      />
    </>
  );
};
