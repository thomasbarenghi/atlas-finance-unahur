import { describe, expect, it } from "vitest";
import { resolvePeriod } from "@/lib/period";

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
