import type { Category } from "@/lib/api/types";

export interface CategoriesListProps {
  categories: Category[];
  isLoading?: boolean;
  onEdit: (category: Category) => void;
  onArchive: (category: Category) => void;
}
