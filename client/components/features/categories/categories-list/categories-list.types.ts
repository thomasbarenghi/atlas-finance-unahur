import type { Category } from "@/lib/api/types";

export interface CategoriesListProps {
  categories: Category[];
  isLoading?: boolean;
}
