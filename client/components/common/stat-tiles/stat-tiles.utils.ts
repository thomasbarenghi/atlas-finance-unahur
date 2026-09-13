export const statDeltaTone = (
  deltaPct: number,
  favorable: "up" | "down",
): string => {
  const direction = favorable === "up" ? 1 : -1;
  return deltaPct * direction >= 0 ? "text-success" : "text-destructive";
};
