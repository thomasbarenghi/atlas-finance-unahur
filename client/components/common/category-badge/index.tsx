import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import type { CategoryBadgeProps } from "./category-badge.types";
import { hexToRgba } from "./category-badge.utils";

export const CategoryBadge = ({ category, className }: CategoryBadgeProps) => {
  return (
    <Badge
      variant="outline"
      className={cn("border-transparent", className)}
      style={{
        backgroundColor: hexToRgba(category.color, 0.15),
        color: category.color,
      }}
    >
      <span
        className="size-2 rounded-full"
        style={{ backgroundColor: category.color }}
        aria-hidden
      />
      {category.name}
    </Badge>
  );
};
