"use client";

import { ListSkeleton } from "@/components/common/list-skeleton";
import type { Category } from "@/lib/api/types";
import { formatCurrency } from "@/lib/format";
import type { CategoryUsageResult } from "../category-usage";
import { CategoryRow } from "./category-row";

export interface CategoryListProps {
  tab: "expense" | "income";
  usage: CategoryUsageResult;
  isLoading: boolean;
  currency: string;
  onEdit: (category: Category) => void;
  onDelete: (category: Category) => void;
}

export const CategoryList = ({
  tab,
  usage,
  isLoading,
  currency,
  onEdit,
  onDelete,
}: CategoryListProps) => {
  return (
    <div className="surface-list rounded-[22px]">
      {isLoading ? (
        <ListSkeleton rows={3} className="px-[18px] py-4" />
      ) : (
        <>
          <header className="bg-[#F9FAFB] dark:bg-muted/40 flex h-[38px] items-center justify-between gap-3 px-[18px] md:h-11">
            <span className="section-title flex items-center gap-1">
              {tab === "expense" ? "Gasto" : "Ingreso"} del período
            </span>
            <span className="flex items-center gap-2">
              <span className="text-muted-foreground text-[10.5px]">Total</span>
              <span className="text-ink text-[11.5px] font-semibold tabular-nums">
                {formatCurrency(usage.total, currency)}
              </span>
            </span>
          </header>

          <ul>
            {usage.items.map((item, index) => (
              <CategoryRow
                key={item.category.id}
                item={item}
                index={index}
                currency={currency}
                onEdit={onEdit}
                onDelete={onDelete}
              />
            ))}
          </ul>
        </>
      )}
    </div>
  );
};
