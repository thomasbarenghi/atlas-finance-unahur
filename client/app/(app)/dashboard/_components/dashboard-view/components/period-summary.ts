import type { DashboardData, PeriodRange } from "@/lib/api/types";
import {
  formatDayMonth,
  formatMonthTitle,
  formatWeekRange,
} from "@/lib/format";
import type { PeriodPreset } from "@/lib/period";

export const buildPeriodLabel = (range: PeriodRange): string => {
  const sameMonth = range.from.slice(0, 7) === range.to.slice(0, 7);
  if (!sameMonth) {
    return `${formatDayMonth(range.from)} – ${formatDayMonth(range.to)}`;
  }
  const fromDay = Number(range.from.slice(8, 10));
  const toDay = Number(range.to.slice(8, 10));
  return `${formatMonthTitle(range.to)} · del ${fromDay} al ${toDay}`;
};

export interface BarsHint {
  desktop: string;
  mobile: string;
}

export const buildBarsHint = (
  data: DashboardData | undefined,
  preset: PeriodPreset,
  range: PeriodRange,
): BarsHint => {
  const buckets = data?.incomeExpenseByPeriod ?? [];
  if (buckets[0]?.bucket !== "week") {
    return {
      desktop: "Comparación mensual.",
      mobile: "Comparación mensual.",
    };
  }

  const weekLabels = buckets
    .map((item) => {
      if (item.bucket !== "week") return formatMonthTitle(item.start);
      const startDay = Number(item.start.slice(8, 10));
      const endDay = Number(item.end.slice(8, 10));
      return item.start.slice(0, 7) === item.end.slice(0, 7)
        ? `${startDay}–${endDay}`
        : formatWeekRange(item.start, item.end);
    })
    .join(", ");
  const monthSuffix =
    preset === "month"
      ? ` de ${formatMonthTitle(range.to).split(" ")[0].toLowerCase()}`
      : "";

  return {
    desktop: `Comparación semanal · ${buckets.length} tramos${monthSuffix}`,
    mobile: `Semanal · ${weekLabels}`,
  };
};
