import type { Asset } from "@/lib/api/types";

export interface AssetsListProps {
  assets: Asset[];
  isLoading?: boolean;
  onEdit: (asset: Asset) => void;
  onValuations: (asset: Asset) => void;
  onArchive: (asset: Asset) => void;
}
