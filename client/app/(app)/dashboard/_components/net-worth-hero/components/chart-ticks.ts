import type { DashboardData } from "@/lib/api/types";

const DESKTOP_DAYS = [1, 5, 10, 15, 20];

const uniqueDates = (dates: (string | undefined)[]): string[] => [
  ...new Set(dates.filter((date): date is string => Boolean(date))),
];

export const buildChartTicks = (
  series: DashboardData["netWorthSeries"],
  isDesktop: boolean,
): string[] => {
  const firstPoint = series[0];
  const lastPoint = series.at(-1);
  if (!firstPoint || !lastPoint) return [];

  const sameMonth = firstPoint.date.slice(0, 7) === lastPoint.date.slice(0, 7);

  if (!sameMonth) {
    const tickCount = isDesktop ? 6 : 3;
    return uniqueDates(
      Array.from(
        { length: tickCount },
        (_, index) =>
          series[Math.round((index * (series.length - 1)) / (tickCount - 1))]
            ?.date,
      ),
    );
  }

  if (isDesktop) {
    const dates = DESKTOP_DAYS.map(
      (day) =>
        series.find((point) => Number(point.date.slice(8, 10)) === day)?.date,
    );
    return uniqueDates([...dates, lastPoint.date]);
  }

  return uniqueDates([
    firstPoint.date,
    series[Math.floor((series.length - 1) / 2)]?.date,
    lastPoint.date,
  ]);
};
