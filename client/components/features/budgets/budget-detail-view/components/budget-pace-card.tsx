import { DetailMetric } from "@/components/common/detail-metric";
import { SectionCard } from "@/components/common/section-card";
import type { BudgetPace } from "@/lib/budget";
import { formatCurrency } from "@/lib/format";
import { cn } from "@/lib/utils";

export interface BudgetPaceCardProps {
  pace: BudgetPace;
  limit: number;
  spent: number;
  currency: string;
}

export const BudgetPaceCard = ({
  pace,
  limit,
  spent,
  currency,
}: BudgetPaceCardProps) => {
  const positive = pace.projectedOver === 0;

  const message = pace.isPastMonth
    ? `Mes cerrado: gastaste ${formatCurrency(spent, currency)} de ${formatCurrency(limit, currency)}.`
    : !pace.isCurrentMonth
      ? "El mes todavía no comenzó."
      : positive
        ? `Con este ritmo vas a cerrar ${formatCurrency(
            Math.max(0, limit - pace.projectedSpend),
            currency,
          )} por debajo del límite.`
        : `Con este ritmo vas a excederte por ${formatCurrency(
            pace.projectedOver,
            currency,
          )}.`;

  return (
    <SectionCard
      title="Ritmo del mes"
      description="Cómo venís respecto del límite mensual."
    >
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <DetailMetric
          label="Promedio diario"
          value={formatCurrency(pace.dailyAverage, currency)}
        />
        <DetailMetric
          label="Proyección de cierre"
          value={formatCurrency(pace.projectedSpend, currency)}
        />
        <DetailMetric
          label="Disponible por día"
          value={formatCurrency(pace.dailyAllowance, currency)}
        />
        <DetailMetric
          label="Días restantes"
          value={String(pace.daysRemaining)}
        />
      </div>
      <div
        className={cn(
          "mt-3 rounded-2xl border p-3 text-sm",
          positive
            ? "border-success/30 bg-success/5 text-success"
            : "border-destructive/30 bg-destructive/5 text-destructive",
        )}
      >
        {message}
      </div>
    </SectionCard>
  );
};
