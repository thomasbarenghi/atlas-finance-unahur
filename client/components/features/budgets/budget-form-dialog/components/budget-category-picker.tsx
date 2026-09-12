"use client";

import type { Category } from "@/lib/api/types";
import { hexToRgba } from "@/lib/colors";
import { cn } from "@/lib/utils";

export interface BudgetCategoryPickerProps {
  categories: Category[];
  value: string;
  onChange: (categoryId: string) => void;
  disabled?: boolean;
}

export const BudgetCategoryPicker = ({
  categories,
  value,
  onChange,
  disabled,
}: BudgetCategoryPickerProps) => (
  <div className="flex w-full min-w-0 gap-2 overflow-x-auto pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
    {categories.map((category) => {
      const active = value === category.id;
      return (
        <button
          type="button"
          key={category.id}
          disabled={disabled}
          aria-pressed={active}
          onClick={() => onChange(category.id)}
          className={cn(
            "flex shrink-0 items-center gap-2 rounded-full border px-3 py-2 text-sm transition-colors disabled:opacity-60",
            active ? "font-medium" : "text-muted-foreground hover:bg-muted/40",
          )}
          style={
            active
              ? {
                  borderColor: category.color,
                  backgroundColor: hexToRgba(category.color, 0.12),
                  color: category.color,
                }
              : undefined
          }
        >
          <span
            className="size-2.5 rounded-full"
            style={{ backgroundColor: category.color }}
            aria-hidden
          />
          {category.name}
        </button>
      );
    })}
  </div>
);
