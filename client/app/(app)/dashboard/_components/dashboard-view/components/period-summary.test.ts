import { describe, expect, it } from "vitest";
import type { DashboardData } from "@/lib/api/types";
import { buildBarsHint, buildPeriodLabel } from "./period-summary";

describe("buildPeriodLabel", () => {
  it("formats a single-month range in Spanish", () => {
    expect(buildPeriodLabel({ from: "2026-10-01", to: "2026-10-26" })).toBe(
      "Octubre 2026 · del 1 al 26",
    );
  });

  it("formats a range that spans months as days", () => {
    expect(buildPeriodLabel({ from: "2026-09-20", to: "2026-10-05" })).toBe(
      "20 sept – 5 oct",
    );
  });
});

describe("buildBarsHint", () => {
  it("announces a monthly comparison", () => {
    const hint = buildBarsHint(undefined, "month", {
      from: "2026-10-01",
      to: "2026-10-26",
    });
    expect(hint.desktop).toBe("Comparación mensual.");
  });

  it("summarizes weekly buckets", () => {
    const data = {
      incomeExpenseByPeriod: [
        { bucket: "week", start: "2026-10-01", end: "2026-10-07" },
        { bucket: "week", start: "2026-10-08", end: "2026-10-14" },
      ],
    } as unknown as DashboardData;
    const hint = buildBarsHint(data, "month", {
      from: "2026-10-01",
      to: "2026-10-14",
    });
    expect(hint.desktop).toBe("Comparación semanal · 2 tramos de octubre");
    expect(hint.mobile).toBe("Semanal · 1–7, 8–14");
  });
});
