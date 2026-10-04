import type { ReactNode } from "react";
import type { Asset, Debt } from "@/lib/api/types";

export interface DebtsListProps {
  debts: Debt[];
  assets: Asset[];
  isLoading?: boolean;
  emptyAction?: ReactNode;
}
