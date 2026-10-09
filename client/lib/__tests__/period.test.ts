import { describe, expect, it } from "vitest";
import {
  buildMonthOptions,
  daysRemainingInMonth,
  describePeriod,
  formatPeriodRange,
  resolvePeriod,
} from "@/lib/period";

const reference = new Date(2026, 0, 20);

describe("resolvePeriod", () => {
  it("resolves the current month from the first day", () => {
    expect(resolvePeriod("month", reference)).toEqual({
      from: "2026-01-01",
      to: "2026-01-20",
    });
  });

  it("resolves the previous full month", () => {
    expect(resolvePeriod("last-month", reference)).toEqual({
      from: "2025-12-01",
      to: "2025-12-31",
    });
  });

  it("resolves rolling windows", () => {
    expect(resolvePeriod("3m", reference).from).toBe("2025-11-01");
    expect(resolvePeriod("6m", reference).from).toBe("2025-08-01");
    expect(resolvePeriod("12m", reference).from).toBe("2025-02-01");
  });

  it("falls back to a 12-month window for custom presets until a range is set", () => {
    expect(resolvePeriod("custom", reference).from).toBe(
      resolvePeriod("12m", reference).from,
    );
  });
});

describe("daysRemainingInMonth", () => {
  it("counts remaining days only for the current month", () => {
    expect(daysRemainingInMonth("2026-01-01", reference)).toBe(11);
    expect(daysRemainingInMonth("2025-12-01", reference)).toBeNull();
    expect(daysRemainingInMonth("2026-03-01", reference)).toBeNull();
    expect(daysRemainingInMonth("2026-02-01", new Date(2026, 1, 28))).toBe(0);
  });

  it("returns null for malformed periods", () => {
    expect(daysRemainingInMonth("nope", reference)).toBeNull();
  });
});

describe("buildMonthOptions", () => {
  it("returns a YYYY-MM option per month around the reference", () => {
    const options = buildMonthOptions(reference, 3, 1);
    expect(options.map((option) => option.value)).toEqual([
      "2025-12",
      "2026-01",
      "2026-02",
    ]);
    expect(options[0].label.length).toBeGreaterThan(0);
  });
});

describe("formatPeriodRange / describePeriod", () => {
  it("formats a range and a described preset", () => {
    const range = { from: "2026-01-01", to: "2026-01-31" };
    expect(formatPeriodRange(range)).toContain("–");
    expect(describePeriod("month", range)).toContain("Este mes");
    expect(describePeriod("custom", range)).toBe(formatPeriodRange(range));
  });
});
