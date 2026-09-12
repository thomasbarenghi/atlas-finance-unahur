import type { PeriodRange } from "@/lib/api/types";
import { toIsoDate } from "@/lib/format";

export type PeriodPreset =
  "month" | "last-month" | "3m" | "6m" | "12m" | "custom";

export const PERIOD_PRESETS: { value: PeriodPreset; label: string }[] = [
  { value: "month", label: "Este mes" },
  { value: "last-month", label: "Mes anterior" },
  { value: "3m", label: "3 meses" },
  { value: "6m", label: "6 meses" },
  { value: "12m", label: "1 año" },
  { value: "custom", label: "Personalizado" },
];

export const PERIOD_PRESET_LABELS: Record<PeriodPreset, string> = {
  month: "Este mes",
  "last-month": "Mes anterior",
  "3m": "Últimos 3 meses",
  "6m": "Últimos 6 meses",
  "12m": "Último año",
  custom: "Período personalizado",
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

  if (preset === "last-month") {
    const first = new Date(
      reference.getFullYear(),
      reference.getMonth() - 1,
      1,
    );
    const last = new Date(reference.getFullYear(), reference.getMonth(), 0);
    return { from: toIsoDate(first), to: toIsoDate(last) };
  }

  const monthsBack = preset === "3m" ? 2 : preset === "6m" ? 5 : 11;
  const from = new Date(
    reference.getFullYear(),
    reference.getMonth() - monthsBack,
    1,
  );
  return { from: toIsoDate(from), to };
};

const formatRangeDate = (iso: string, withYear: boolean): string =>
  new Intl.DateTimeFormat("es-AR", {
    day: "numeric",
    month: "short",
    ...(withYear ? { year: "numeric" } : {}),
  })
    .format(new Date(`${iso}T00:00:00`))
    .replace(".", "");

export const formatPeriodRange = (range: PeriodRange): string => {
  const sameYear = range.from.slice(0, 4) === range.to.slice(0, 4);
  return `${formatRangeDate(range.from, !sameYear)} – ${formatRangeDate(
    range.to,
    true,
  )}`;
};

export const describePeriod = (
  preset: PeriodPreset,
  range: PeriodRange,
): string =>
  preset === "custom"
    ? formatPeriodRange(range)
    : `${PERIOD_PRESET_LABELS[preset]} · ${formatPeriodRange(range)}`;
