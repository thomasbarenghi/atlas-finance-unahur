import type { Asset, Debt } from "@/lib/api/types";

export interface DebtsListProps {
  debts: Debt[];
  assets: Asset[];
  isLoading?: boolean;
  onEdit: (debt: Debt) => void;
  onArchive: (debt: Debt) => void;
}
