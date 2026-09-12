export interface StatTile {
  label: string;
  value: string;
  tone?: string;
  deltaPct?: number | null;
  deltaUnit?: "percent" | "points";
  favorable?: "up" | "down";
}

export interface StatTilesProps {
  stats: StatTile[];
}
