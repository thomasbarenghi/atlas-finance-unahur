import type { PeriodRange } from "@/lib/api/types";
import { formatMonth, monthStartFromInput, toIsoDate } from "@/lib/format";

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

export interface MonthOption {
  value: string;
  label: string;
}

export const buildMonthOptions = (
  reference: Date = new Date(),
  count = 12,
  monthsBack = 5,
): MonthOption[] =>
  Array.from({ length: count }, (_, index) => {
    const date = new Date(
      reference.getFullYear(),
      reference.getMonth() + index - monthsBack,
      1,
    );
    const value = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(
      2,
      "0",
    )}`;
    return { value, label: formatMonth(monthStartFromInput(value)) };
  });

export const daysRemainingInMonth = (
  periodIso: string,
  reference: Date = new Date(),
): number | null => {
  const [year, month] = periodIso.slice(0, 7).split("-").map(Number);
  if (!year || !month) return null;
  const monthStart = new Date(year, month - 1, 1);
  const monthEnd = new Date(year, month, 0);
  const today = new Date(
    reference.getFullYear(),
    reference.getMonth(),
    reference.getDate(),
  );
  if (today < monthStart || today > monthEnd) return null;
  return Math.max(
    0,
    Math.round((monthEnd.getTime() - today.getTime()) / 86_400_000),
  );
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
