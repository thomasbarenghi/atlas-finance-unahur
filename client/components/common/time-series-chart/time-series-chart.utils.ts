import { computeChartDomain } from "@/lib/chart-scale";

export const computeSeriesDomain = (
  data: Record<string, string | number>[],
  dataKeys: string[],
): [number, number] =>
  computeChartDomain(
    data.flatMap((row) => dataKeys.map((key) => Number(row[key]))),
  );
