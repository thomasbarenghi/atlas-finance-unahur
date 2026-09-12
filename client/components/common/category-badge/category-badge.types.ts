import type { Category } from "@/lib/api/types";

export interface CategoryBadgeProps {
  category: Pick<Category, "name" | "color">;
  className?: string;
}
