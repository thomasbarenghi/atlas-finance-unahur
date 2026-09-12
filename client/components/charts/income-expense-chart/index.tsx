import { BarChart3 } from "lucide-react";
import { Bar, BarChart, CartesianGrid, XAxis } from "recharts";
import { ChartDataTable } from "@/components/common/chart-data-table";
import { EmptyState } from "@/components/common/empty-state";
import {
  ChartContainer,
  ChartLegend,
  ChartLegendContent,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart";
import { formatCurrency, formatMonth } from "@/lib/format";

export interface IncomeExpenseChartProps {
  data: { month: string; income: number; expenses: number }[];
  currency: string;
}

const config = {
  income: { label: "Ingresos", color: "var(--chart-1)" },
  expenses: { label: "Gastos", color: "var(--chart-4)" },
} satisfies ChartConfig;

export const IncomeExpenseChart = ({
  data,
  currency,
}: IncomeExpenseChartProps) => {
  const isEmpty = data.every((row) => row.income === 0 && row.expenses === 0);

  if (data.length === 0 || isEmpty) {
    return (
      <EmptyState
        icon={BarChart3}
        title="Sin movimientos en el período"
        description="Registrá ingresos y gastos para comparar su evolución mensual."
      />
    );
  }

  return (
    <>
      <ChartContainer config={config} className="h-64 w-full">
        <BarChart
          data={data}
          accessibilityLayer
          role="img"
          aria-label="Ingresos y gastos por mes"
        >
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
          <ChartLegend content={<ChartLegendContent />} />
          <Bar dataKey="income" fill="var(--color-income)" radius={6} />
          <Bar dataKey="expenses" fill="var(--color-expenses)" radius={6} />
        </BarChart>
      </ChartContainer>
      <ChartDataTable
        caption="Ingresos y gastos por mes"
        headers={["Mes", "Ingresos", "Gastos"]}
        rows={data.map((row) => ({
          key: row.month,
          cells: [
            row.month,
            formatCurrency(row.income, currency),
            formatCurrency(row.expenses, currency),
          ],
        }))}
      />
    </>
  );
};
