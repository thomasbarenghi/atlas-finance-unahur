import type { PeriodRange } from "@/lib/api/types";
import { toIsoDate } from "@/lib/format";

export type PeriodPreset = "30d" | "90d" | "6m" | "12m" | "custom";

export const PERIOD_PRESETS: { value: PeriodPreset; label: string }[] = [
  { value: "30d", label: "30 días" },
  { value: "90d", label: "90 días" },
  { value: "6m", label: "6 meses" },
  { value: "12m", label: "12 meses" },
  { value: "custom", label: "Personalizado" },
];

export const resolvePeriod = (
  preset: PeriodPreset,
  reference: Date = new Date(),
): PeriodRange => {
  const to = toIsoDate(reference);
  if (preset === "30d") {
    const from = new Date(reference);
    from.setDate(from.getDate() - 29);
    return { from: toIsoDate(from), to };
  }
  if (preset === "90d") {
    const from = new Date(reference);
    from.setDate(from.getDate() - 89);
    return { from: toIsoDate(from), to };
  }
  const months = preset === "6m" ? 5 : 11;
  const from = new Date(
    reference.getFullYear(),
    reference.getMonth() - months,
    1,
  );
  return { from: toIsoDate(from), to };
};
