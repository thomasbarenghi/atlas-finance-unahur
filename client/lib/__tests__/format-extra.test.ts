import { describe, expect, it } from "vitest";
import {
  formatCurrency,
  formatDate,
  formatMoneyInput,
  formatMonth,
  formatPercent,
  formatPercentPoints,
} from "@/lib/format";
import { ROOT_ROUTES, SECTIONS } from "@/lib/sections";

describe("format helpers", () => {
  it("formats currency and percentages", () => {
    expect(formatCurrency(1500, "ARS")).toContain("1.500");
    expect(formatPercent(0.123)).toContain("12,3");
    expect(formatPercentPoints(12.3)).toContain("12,3");
  });

  it("formats money input values and blanks non-finite input", () => {
    expect(formatMoneyInput(1234.5)).toBe("1.234,5");
    expect(formatMoneyInput(null)).toBe("");
    expect(formatMoneyInput(Number.NaN)).toBe("");
  });

  it("formats dates and months", () => {
    expect(formatDate("2026-01-31")).toContain("2026");
    expect(formatMonth("2026-01-01").toLowerCase()).toContain("ene");
  });
});

describe("sections", () => {
  it("exposes the navigation routes", () => {
    expect(SECTIONS.dashboard.href).toBe("/dashboard");
    expect(SECTIONS.settings.label).toBe("Ajustes");
    expect(ROOT_ROUTES).toEqual([
      "/dashboard",
      "/transactions",
      "/assistant",
      "/profile",
    ]);
  });
});
