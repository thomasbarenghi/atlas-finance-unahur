export interface StatTile {
  label: string;
  value: string;
  tone?: string;
  deltaPct?: number | null;
  favorable?: "up" | "down";
}

export interface StatTilesProps {
  stats: StatTile[];
}
