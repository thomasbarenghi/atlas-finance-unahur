import { describe, expect, it } from "vitest";
import { getPeriodLabel, resolvePeriod } from "@/lib/period";

const reference = new Date(2026, 0, 20);
const october = { from: "2026-10-01", to: "2026-10-26" };

describe("resolvePeriod", () => {
  it("resolves the current month from the first day", () => {
    expect(resolvePeriod("month", reference)).toEqual({
      from: "2026-01-01",
      to: "2026-01-20",
    });
  });

  it("resolves a rolling 30-day window without cutting at month boundaries", () => {
    expect(resolvePeriod("last-30-days", reference)).toEqual({
      from: "2025-12-22",
      to: "2026-01-20",
    });
  });

  it("resolves monthly windows", () => {
    expect(resolvePeriod("6m", reference).from).toBe("2025-08-01");
    expect(resolvePeriod("12m", reference).from).toBe("2025-02-01");
  });
});

describe("getPeriodLabel", () => {
  it("uses the preset label by default", () => {
    expect(getPeriodLabel("month", october)).toBe("Este mes");
    expect(getPeriodLabel("6m", october)).toBe("6 meses");
  });

  it("shows the short 30-day label when requested", () => {
    expect(getPeriodLabel("last-30-days", october, "short")).toBe("30 días");
  });
});
