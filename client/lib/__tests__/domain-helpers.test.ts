import { describe, expect, it } from "vitest";
import { budgetPace } from "@/lib/budget";
import { goalProgress } from "@/lib/goal";
import {
  equityFor,
  linkedAssetForDebt,
  linkedDebtForAsset,
  sortValuations,
  valuationChange,
} from "@/lib/patrimony";
import { sortCategories } from "@/lib/categories";
import {
  clampWidgetSpan,
  DEFAULT_DASHBOARD_LAYOUT,
  DASHBOARD_WIDGETS,
  normalizeDashboardLayout,
} from "@/lib/dashboard-widgets";
import { hexToRgba } from "@/lib/colors";
import { computeChartDomain } from "@/lib/chart-scale";
import { buildPeriodSummaryStats } from "@/lib/period-stats";
import {
  makeAsset,
  makeCategory,
  makeDebt,
  makeGoal,
  makeValuation,
} from "@/lib/test/factories";

const reference = new Date(2026, 0, 20);

describe("budgetPace", () => {
  const base = {
    period: "2026-01-01",
    spent: 40_000,
    limit: 100_000,
    available: 60_000,
  };

  it("projects overspend during the current month", () => {
    const pace = budgetPace(base, reference);
    expect(pace.daysInMonth).toBe(31);
    expect(pace.daysElapsed).toBe(20);
    expect(pace.daysRemaining).toBe(11);
    expect(pace.isCurrentMonth).toBe(true);
    expect(pace.dailyAverage).toBeCloseTo(2000);
    expect(pace.projectedSpend).toBeCloseTo(62_000);
    expect(pace.projectedOver).toBe(0);
    expect(pace.dailyAllowance).toBeCloseTo(60_000 / 11);
  });

  it("flags overspend when the projection exceeds the limit", () => {
    const pace = budgetPace(
      { ...base, spent: 90_000, available: 10_000 },
      reference,
    );
    expect(pace.projectedOver).toBeCloseTo((90_000 / 20) * 31 - 100_000);
  });

  it("freezes past months and never offers a negative daily allowance", () => {
    const past = budgetPace(
      {
        period: "2025-12-01",
        spent: 120_000,
        limit: 100_000,
        available: -20_000,
      },
      reference,
    );
    expect(past.isPastMonth).toBe(true);
    expect(past.daysElapsed).toBe(31);
    expect(past.daysRemaining).toBe(0);
    expect(past.projectedSpend).toBe(120_000);
    expect(past.dailyAllowance).toBe(0);
  });

  it("does not project for future months", () => {
    const future = budgetPace(
      { period: "2026-03-01", spent: 0, limit: 100_000, available: 100_000 },
      reference,
    );
    expect(future.isCurrentMonth).toBe(false);
    expect(future.isPastMonth).toBe(false);
    expect(future.daysElapsed).toBe(0);
    expect(future.projectedSpend).toBe(0);
  });
});

describe("goalProgress", () => {
  it("computes the remaining amount and monthly saving", () => {
    const progress = goalProgress(
      makeGoal({
        savedAmount: 120_000,
        targetAmount: 500_000,
        targetDate: "2026-07-01",
      }),
      reference,
    );
    expect(progress.remaining).toBe(380_000);
    expect(progress.monthlySaving).toBeCloseTo(380_000 / 6);
  });

  it("returns no monthly saving when already achieved or without a deadline", () => {
    expect(
      goalProgress(
        makeGoal({ savedAmount: 500_000, targetAmount: 500_000 }),
        reference,
      ).monthlySaving,
    ).toBeNull();
    expect(
      goalProgress(makeGoal({ targetDate: null }), reference).monthlySaving,
    ).toBeNull();
  });

  it("returns no monthly saving for a past deadline", () => {
    expect(
      goalProgress(
        makeGoal({
          savedAmount: 0,
          targetAmount: 100_000,
          targetDate: "2025-01-01",
        }),
        reference,
      ).monthlySaving,
    ).toBeNull();
  });
});

describe("patrimony helpers", () => {
  it("sorts valuations ascending and computes the latest change", () => {
    const valuations = [
      makeValuation({ id: "b", value: 120, date: "2026-02-01" }),
      makeValuation({ id: "a", value: 100, date: "2026-01-01" }),
    ];
    expect(sortValuations(valuations).map((item) => item.id)).toEqual([
      "a",
      "b",
    ]);

    const change = valuationChange(valuations);
    expect(change?.current).toBe(120);
    expect(change?.previous).toBe(100);
    expect(change?.delta).toBe(20);
    expect(change?.deltaPct).toBeCloseTo(20);
  });

  it("handles empty and single-valuation histories", () => {
    expect(valuationChange([])).toBeNull();
    const single = valuationChange([makeValuation({ value: 100 })]);
    expect(single?.previous).toBeNull();
    expect(single?.delta).toBe(0);
    expect(single?.deltaPct).toBeNull();
  });

  it("links debts and assets both ways", () => {
    const asset = makeAsset({ id: "asset-1", debtId: "debt-1" });
    const debt = makeDebt({ id: "debt-1", assetId: "asset-1" });
    expect(linkedDebtForAsset([debt], asset)?.id).toBe("debt-1");
    expect(linkedAssetForDebt([asset], debt)?.id).toBe("asset-1");
    expect(equityFor(100, 40)).toBe(60);
  });
});

describe("sortCategories", () => {
  it("puts system categories first and sorts the rest by name", () => {
    const categories = [
      makeCategory({ name: "Zeta", isSystem: false }),
      makeCategory({ name: "food", isSystem: true }),
      makeCategory({ name: "Alfa", isSystem: false }),
    ];
    expect(sortCategories(categories).map((category) => category.name)).toEqual(
      ["food", "Alfa", "Zeta"],
    );
  });
});

describe("dashboard layout", () => {
  it("clamps spans per widget", () => {
    expect(clampWidgetSpan("netWorth", 5)).toBe(3);
    expect(clampWidgetSpan("incomeExpense", 0)).toBe(1);
    expect(clampWidgetSpan("incomeExpense", "x" as unknown)).toBe(1);
  });

  it("normalizes a legacy array layout, hiding and de-duplicating widgets", () => {
    const normalized = normalizeDashboardLayout([
      { id: "netWorth", hidden: true },
      { id: "incomeExpense" },
      { id: "incomeExpense" },
    ]);
    expect(normalized.hidden).toContain("netWorth");
    const all = normalized.columns.flat();
    expect(new Set(all).size).toBe(all.length);
    // Hidden widgets are not placed in a column.
    expect(all).toHaveLength(DASHBOARD_WIDGETS.length - 1);
  });

  it("falls back to the default layout for garbage input", () => {
    expect(normalizeDashboardLayout("nope").columns).toEqual(
      DEFAULT_DASHBOARD_LAYOUT.columns,
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
