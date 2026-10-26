import { describe, expect, it } from "vitest";
import { computeChartDomain } from "./chart-scale";

describe("computeChartDomain", () => {
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
