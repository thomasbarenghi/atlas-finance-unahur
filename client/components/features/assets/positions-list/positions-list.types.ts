import type { Position } from "@/lib/api/types";

export interface PositionsListProps {
  positions: Position[];
  isLoading?: boolean;
  onEdit: (position: Position) => void;
  onDelete: (position: Position) => void;
}
