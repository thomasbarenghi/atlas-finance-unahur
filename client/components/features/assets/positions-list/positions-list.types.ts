import type { ReactNode } from "react";
import type { Position } from "@/lib/api/types";

export interface PositionsListProps {
  positions: Position[];
  isLoading?: boolean;
  emptyAction?: ReactNode;
}
