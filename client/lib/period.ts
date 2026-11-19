import type { PeriodRange } from "@/lib/api/types";
import { toIsoDate } from "@/lib/format";

export type PeriodPreset = "month" | "last-30-days" | "6m" | "12m";

export const PERIOD_PRESETS: { value: PeriodPreset; label: string }[] = [
  { value: "month", label: "Este mes" },
  { value: "last-30-days", label: "Últimos 30 días" },
  { value: "6m", label: "6 meses" },
  { value: "12m", label: "12 meses" },
];

type PeriodLabelMode = "preset" | "short";

export const getPeriodLabel = (
  preset: PeriodPreset,
  range: PeriodRange,
  mode: PeriodLabelMode = "preset",
): string => {
  if (mode === "short" && preset === "last-30-days") return "30 días";
  return (
    PERIOD_PRESETS.find((option) => option.value === preset)?.label ?? "Período"
  );
};

const addDays = (date: Date, days: number): Date => {
  const next = new Date(date);
  next.setDate(next.getDate() + days);
  return next;
};

export const resolvePeriod = (
  preset: PeriodPreset,
  reference: Date = new Date(),
): PeriodRange => {
  const to = toIsoDate(reference);

  if (preset === "month") {
    return {
      from: toIsoDate(
        new Date(reference.getFullYear(), reference.getMonth(), 1),
      ),
      to,
    };
  }

  if (preset === "last-30-days") {
    return { from: toIsoDate(addDays(reference, -29)), to };
  }

  const monthsBack = preset === "6m" ? 5 : 11;
  const from = new Date(
    reference.getFullYear(),
    reference.getMonth() - monthsBack,
    1,
  );
  return { from: toIsoDate(from), to };
};
