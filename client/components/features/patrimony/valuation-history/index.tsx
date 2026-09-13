import { History, LineChart } from "lucide-react";
import { EmptyState } from "@/components/common/empty-state";
import { Money } from "@/components/common/money";
import { SectionCard } from "@/components/common/section-card";
import { TimeSeriesChart } from "@/components/common/time-series-chart";
import { formatCurrency, formatDate, formatMonth } from "@/lib/format";
import { sortValuations } from "@/lib/patrimony";
import type { ValuationHistoryProps } from "./valuation-history.types";

export const ValuationHistory = ({
  valuations,
  currency,
}: ValuationHistoryProps) => {
  const ordered = sortValuations(valuations);
  const chartData = ordered.map((valuation) => ({
    date: valuation.date,
    value: valuation.value,
  }));

  return (
    <div className="flex flex-col gap-6">
      <SectionCard
        title="Evolución del valor"
        description="Valuaciones registradas a lo largo del tiempo."
      >
        {chartData.length >= 2 ? (
          <TimeSeriesChart
            data={chartData}
            xKey="date"
            xFormatter={(value) => formatMonth(value)}
            series={[
              {
                dataKey: "value",
                label: "Valor",
                color: "var(--chart-1)",
              },
            ]}
            valueFormatter={(value) => formatCurrency(value, currency)}
            ariaLabel="Evolución del valor del activo"
            emptyTitle="Todavía no hay historial de valuaciones"
            emptyDescription="Registrá una nueva valuación para empezar a ver la evolución de este activo."
          />
        ) : (
          <EmptyState
            icon={LineChart}
            title="Todavía no hay historial de valuaciones"
            description="Registrá una nueva valuación para empezar a ver la evolución de este activo."
          />
        )}
      </SectionCard>

      <SectionCard
        title="Historial de valuaciones"
        description={`${ordered.length} ${
          ordered.length === 1 ? "registro" : "registros"
        }`}
      >
        {ordered.length === 0 ? (
          <EmptyState
            icon={History}
            title="Sin valuaciones"
            description="Agregá la primera valuación para valuar este activo."
          />
        ) : (
          <ul className="flex flex-col divide-y">
            {[...ordered].reverse().map((valuation) => (
              <li
                key={valuation.id}
                className="flex items-center justify-between gap-2 py-2 text-sm"
              >
                <span className="text-muted-foreground">
                  {formatDate(valuation.date)}
                </span>
                <Money value={valuation.value} currency={valuation.currency} />
              </li>
            ))}
          </ul>
        )}
      </SectionCard>
    </div>
  );
};
