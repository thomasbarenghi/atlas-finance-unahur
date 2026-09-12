import type { Category, CategoryType } from "@/lib/api/types";

export interface CategoryFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  category?: Category;
  initialType?: CategoryType;
}
