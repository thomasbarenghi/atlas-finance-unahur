import type { Asset } from "@/lib/api/types";

export interface AssetFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  asset?: Asset;
}
