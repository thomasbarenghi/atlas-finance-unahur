import { describe, expect, it } from "vitest";
import type { DashboardData } from "@/lib/api/types";
import { buildChartTicks } from "./chart-ticks";

const series = (dates: string[]): DashboardData["netWorthSeries"] =>
  dates.map((date) => ({ date, value: 100 }));

describe("buildChartTicks", () => {
  it("returns the first, middle and last points on mobile within one month", () => {
    const ticks = buildChartTicks(
      series([
        "2026-10-01",
        "2026-10-02",
        "2026-10-03",
        "2026-10-04",
        "2026-10-05",
      ]),
      false,
    );

    expect(ticks).toEqual(["2026-10-01", "2026-10-03", "2026-10-05"]);
  });

  it("picks the fixed days plus the last point on desktop within one month", () => {
    const ticks = buildChartTicks(
      series(["2026-10-01", "2026-10-05", "2026-10-10", "2026-10-26"]),
      true,
    );

    expect(ticks).toEqual([
      "2026-10-01",
      "2026-10-05",
      "2026-10-10",
      "2026-10-26",
    ]);
  });

  it("spreads ticks across the range when it spans several months", () => {
    const ticks = buildChartTicks(
      series(["2026-08-01", "2026-09-01", "2026-10-01"]),
      false,
    );

    expect(ticks).toEqual(["2026-08-01", "2026-09-01", "2026-10-01"]);
  });

  it("returns no ticks for an empty series", () => {
    expect(buildChartTicks([], true)).toEqual([]);
  });

  it("does not repeat a tick when the series has a single point", () => {
    expect(buildChartTicks(series(["2026-10-01"]), false)).toEqual([
      "2026-10-01",
    ]);
  });
});
