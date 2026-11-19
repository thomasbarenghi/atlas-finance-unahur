export const computeChartDomain = (values: number[]): [number, number] => {
  const finite = values.filter((value) => Number.isFinite(value));

  if (finite.length === 0) return [0, 0];

  const min = Math.min(...finite);
  const max = Math.max(...finite);
  const spread = max - min;
  const padding = spread > 0 ? spread * 0.15 : Math.abs(max) * 0.02 || 1;

  return [min - padding, max + padding];
};
