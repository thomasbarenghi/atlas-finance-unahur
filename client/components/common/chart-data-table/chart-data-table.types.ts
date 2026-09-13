import type { ReactNode } from "react";

export interface ChartDataTableRow {
  key: string;
  cells: ReactNode[];
}

export interface ChartDataTableProps {
  caption: string;
  headers: string[];
  rows: ChartDataTableRow[];
}
