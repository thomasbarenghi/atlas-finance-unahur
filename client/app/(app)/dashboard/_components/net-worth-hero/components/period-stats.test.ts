import { describe, expect, it } from "vitest";
import { buildPeriodSummaryStats } from "./period-stats";

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
    expect(stats.find((stat) => stat.key === "income")?.info).toBeUndefined();
    expect(stats.find((stat) => stat.key === "expenses")?.info).toBeUndefined();
    expect(stats.find((stat) => stat.key === "savings")?.info?.formula).toBe(
      "Ingresos − gastos",
    );
  });

  it("reports a zero savings rate when there is no income", () => {
    const stats = buildPeriodSummaryStats(0, 400, -400, "ARS");
    expect(stats.find((stat) => stat.key === "savingsRate")?.display).toMatch(
      /0/,
    );
  });
});
