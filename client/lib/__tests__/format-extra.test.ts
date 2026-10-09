import { describe, expect, it } from "vitest";
import {
  formatApproxCurrency,
  formatCompactCurrency,
  formatCurrency,
  formatDate,
  formatDateTime,
  formatMoneyInput,
  formatMonth,
  formatMonthName,
  formatPercent,
  formatPercentPoints,
} from "@/lib/format";
import { ROOT_ROUTES, SECTIONS } from "@/lib/sections";

describe("format helpers", () => {
  it("formats currency and percentages", () => {
    expect(formatCurrency(1500, "ARS")).toContain("1.500");
    expect(formatPercent(0.123)).toContain("12,3");
    expect(formatPercentPoints(12.3)).toContain("12,3");
    expect(formatApproxCurrency(5, "ARS")).toMatch(/^≈ /);
    expect(formatCompactCurrency(1_500_000, "ARS")).toMatch(/1,5/);
  });

  it("formats money input values and blanks non-finite input", () => {
    expect(formatMoneyInput(1234.5)).toBe("1.234,5");
    expect(formatMoneyInput(null)).toBe("");
    expect(formatMoneyInput(Number.NaN)).toBe("");
  });

  it("formats dates, datetimes, months and month names", () => {
    expect(formatDate("2026-01-31")).toContain("2026");
    expect(formatDateTime("2026-01-31T10:00:00.000Z")).toMatch(/:/);
    expect(formatMonth("2026-01-01").toLowerCase()).toContain("ene");
    expect(formatMonthName("2026-01-01").toLowerCase()).toContain("enero");
  });
});

describe("sections", () => {
  it("exposes the navigation routes", () => {
    expect(SECTIONS.dashboard.href).toBe("/dashboard");
    expect(SECTIONS.settings.label).toBe("Ajustes");
    expect(ROOT_ROUTES).toEqual([
      "/dashboard",
      "/transactions",
      "/reports",
      "/assistant",
      "/profile",
    ]);
  });
});
