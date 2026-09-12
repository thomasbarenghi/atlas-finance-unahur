import type { Asset } from "@/lib/api/types";

export interface AssetsListProps {
  assets: Asset[];
  isLoading?: boolean;
}
