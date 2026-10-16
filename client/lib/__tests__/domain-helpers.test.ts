import { describe, expect, it } from "vitest";
import { sortCategories } from "@/lib/categories";
import { hexToRgba } from "@/lib/colors";
import { computeChartDomain } from "@/lib/chart-scale";
import { buildPeriodSummaryStats } from "@/lib/period-stats";
import { makeCategory } from "@/lib/test/factories";

describe("sortCategories", () => {
  it("sorts categories by name", () => {
    const categories = [
      makeCategory({ name: "Zeta" }),
      makeCategory({ name: "Alfa" }),
    ];
    expect(sortCategories(categories).map((category) => category.name)).toEqual(
      ["Alfa", "Zeta"],
    );
  });
});

describe("colors and chart scale", () => {
  it("expands 3-digit hex and falls back for invalid input", () => {
    expect(hexToRgba("#fff", 0.5)).toBe("rgba(255, 255, 255, 0.5)");
    expect(hexToRgba("#ef4444", 0.15)).toBe("rgba(239, 68, 68, 0.15)");
    expect(hexToRgba("#zzz", 0.5)).toBe("rgba(100, 116, 139, 0.5)");
  });

  it("pads the chart domain and ignores non-finite values", () => {
    expect(computeChartDomain([])).toEqual([0, 0]);
    expect(computeChartDomain([Number.NaN, Number.POSITIVE_INFINITY])).toEqual([
      0, 0,
    ]);
    const [min, max] = computeChartDomain([0, 100]);
    expect(min).toBeCloseTo(-15);
    expect(max).toBeCloseTo(115);
    const [flatMin, flatMax] = computeChartDomain([10]);
    expect(flatMin).toBeLessThan(10);
    expect(flatMax).toBeGreaterThan(10);
  });
});

describe("buildPeriodSummaryStats", () => {
  it("returns income, expenses, savings and savings rate", () => {
    const stats = buildPeriodSummaryStats(1000, 400, 600, "ARS");
    expect(stats.map((stat) => stat.key)).toEqual([
      "income",
      "expenses",
      "savings",
      "savingsRate",
    ]);
    expect(stats.find((stat) => stat.key === "savings")?.hint).toContain(
      "transferencias",
    );
  });

  it("reports a zero savings rate when there is no income", () => {
    const stats = buildPeriodSummaryStats(0, 400, -400, "ARS");
    expect(stats.find((stat) => stat.key === "savingsRate")?.display).toMatch(
      /0/,
    );
  });
});
