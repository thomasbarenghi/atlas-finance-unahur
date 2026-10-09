import { describe, expect, it } from "vitest";
import {
  clampWidgetSpan,
  dashboardWidgetLabel,
  dashboardWidgetMaxSpan,
  dashboardWidgetWeight,
  DEFAULT_DASHBOARD_LAYOUT,
  DASHBOARD_WIDGETS,
  normalizeDashboardLayout,
  type DashboardWidgetId,
} from "@/lib/dashboard-widgets";

const allIds = DASHBOARD_WIDGETS.map((widget) => widget.id);

describe("dashboard widget metadata", () => {
  it("resolves known widgets and falls back for unknown ids", () => {
    expect(dashboardWidgetLabel("netWorth")).toBe("Patrimonio neto");
    expect(dashboardWidgetWeight("netWorth")).toBe(3);
    expect(dashboardWidgetMaxSpan("netWorth")).toBe(3);
    expect(dashboardWidgetLabel("missing" as DashboardWidgetId)).toBe(
      "missing",
    );
    expect(dashboardWidgetWeight("missing" as DashboardWidgetId)).toBe(4);
    expect(dashboardWidgetMaxSpan("missing" as DashboardWidgetId)).toBe(1);
  });

  it("clamps spans, treating invalid values as 1", () => {
    expect(clampWidgetSpan("netWorth", 2)).toBe(2);
    expect(clampWidgetSpan("netWorth", 99)).toBe(3);
    expect(clampWidgetSpan("budgetUsage", -5)).toBe(1);
    expect(clampWidgetSpan("budgetUsage", Number.NaN)).toBe(1);
    expect(clampWidgetSpan("budgetUsage", "2" as unknown)).toBe(1);
  });
});

describe("normalizeDashboardLayout", () => {
  it("accepts a persisted object layout, dropping unknown/duplicate ids", () => {
    const normalized = normalizeDashboardLayout({
      columns: [["netWorth"], ["netWorth", "unknown"], []],
      hidden: ["incomeDonut", "unknown"],
      spans: { netWorth: 99, incomeExpense: 0 },
    });

    const placed = normalized.columns.flat();
    expect(placed).toContain("netWorth");
    expect(placed.filter((id) => id === "netWorth")).toHaveLength(1);
    expect(placed).not.toContain("unknown");
    expect(normalized.hidden).toEqual(["incomeDonut"]);
    expect(normalized.spans.netWorth).toBe(3);
    expect(normalized.spans.incomeExpense).toBe(1);

    const known = new Set([...placed, ...normalized.hidden]);
    expect(known.size).toBe(allIds.length);
  });

  it("fills widgets missing from a persisted layout exactly once", () => {
    const normalized = normalizeDashboardLayout({
      columns: [["netWorth"], [], []],
      hidden: [],
      spans: {},
    });
    const placed = normalized.columns.flat();
    expect(new Set(placed).size).toBe(allIds.length);
    expect(placed).toHaveLength(allIds.length);
  });

  it("handles a legacy array layout with hidden and unknown entries", () => {
    const normalized = normalizeDashboardLayout([
      { id: "netWorth", hidden: true },
      { id: "incomeExpense" },
      { id: "unknown" },
      "garbage",
    ]);
    expect(normalized.hidden).toEqual(["netWorth"]);
    expect(normalized.columns.flat()).not.toContain("netWorth");
    expect(normalized.columns.flat()).toHaveLength(allIds.length - 1);
  });

  it("falls back to the default layout for non-object input", () => {
    expect(normalizeDashboardLayout(null).columns).toEqual(
      DEFAULT_DASHBOARD_LAYOUT.columns,
    );
    expect(normalizeDashboardLayout("nope").columns).toEqual(
      DEFAULT_DASHBOARD_LAYOUT.columns,
    );
    expect(normalizeDashboardLayout(42).columns).toEqual(
      DEFAULT_DASHBOARD_LAYOUT.columns,
    );
  });

  it("ignores non-array columns and keeps default spans", () => {
    const normalized = normalizeDashboardLayout({ columns: "nope" });
    expect(normalized.columns.flat()).toHaveLength(allIds.length);
    expect(normalized.spans).toEqual(DEFAULT_DASHBOARD_LAYOUT.spans);
  });
});
