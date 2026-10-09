import type { ReactNode } from "react";
import type { Asset } from "@/lib/api/types";

export interface AssetsListProps {
  assets: Asset[];
  isLoading?: boolean;
  emptyAction?: ReactNode;
}
