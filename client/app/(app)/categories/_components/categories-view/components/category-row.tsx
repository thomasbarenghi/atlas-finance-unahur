"use client";

import { createElement } from "react";
import { Pencil, Trash2 } from "lucide-react";
import { RowActionsMenu } from "@/components/common/row-actions-menu";
import type { Category } from "@/lib/api/types";
import { formatCurrency, formatPercent } from "@/lib/format";
import { cn } from "@/lib/utils";
import type { CategoryUsage } from "../category-usage";
import { categoryIcon } from "../category-icon";

export interface CategoryRowProps {
  item: CategoryUsage;
  index: number;
  currency: string;
  onEdit: (category: Category) => void;
  onDelete: (category: Category) => void;
}

const CategoryBadge = ({ isSystem }: { isSystem: boolean }) => (
  <span
    className={cn(
      "rounded-[6px] px-[7px] py-0.5 text-[9.5px] leading-[13px] font-semibold",
      isSystem
        ? "text-muted-foreground bg-secondary"
        : "text-primary bg-accent",
    )}
  >
    {isSystem ? (
      <>
        <span className="md:hidden">Sistema</span>
        <span className="hidden md:inline">Del sistema</span>
      </>
    ) : (
      "Propia"
    )}
  </span>
);

const UsageBar = ({
  pct,
  color,
  className,
}: {
  pct: number;
  color: string;
  className?: string;
}) => (
  <span
    className={cn("bg-line2 block h-1 overflow-hidden rounded-full", className)}
  >
    <span
      className="block h-full rounded-full"
      style={{
        width: `${Math.min(pct * 100, 100)}%`,
        backgroundColor: color,
      }}
    />
  </span>
);

export const CategoryRow = ({
  item,
  index,
  currency,
  onEdit,
  onDelete,
}: CategoryRowProps) => {
  const { category } = item;

  return (
    <li className={cn(index > 0 && "border-line2 border-t")}>
      <div className="flex flex-col px-3.5 py-3 md:px-[18px] md:py-[19px]">
        <div className="flex items-center gap-2.5 md:gap-3.5">
          <span
            className="flex size-[34px] shrink-0 items-center justify-center rounded-[10px] md:size-9"
            style={{
              backgroundColor: `${category.color}1F`,
              color: category.color,
            }}
          >
            {createElement(categoryIcon(category.icon), {
              className: "size-[17px]",
              "aria-hidden": true,
            })}
          </span>

          <div className="flex min-w-0 flex-1 flex-col gap-[3px] md:gap-0.5">
            <div className="flex min-w-0 items-center gap-1.5 md:gap-2">
              <span className="text-ink truncate text-[13.5px] leading-[18px] font-semibold md:text-[14.5px] md:leading-[20px]">
                {category.name}
              </span>
              <CategoryBadge isSystem={category.isSystem} />
            </div>
            <span className="text-muted-foreground text-[10px] leading-[14px] md:text-[11.5px] md:leading-[16px]">
              {item.count} movimiento{item.count === 1 ? "" : "s"}
              <span className="md:hidden">
                {" · "}
                {formatPercent(item.pct)}
              </span>
            </span>
          </div>

          <UsageBar
            pct={item.pct}
            color={category.color}
            className="hidden w-[120px] shrink-0 md:block"
          />

          <span className="text-muted-foreground hidden w-[52px] shrink-0 text-right text-[11px] leading-[15px] tabular-nums md:block">
            {formatPercent(item.pct)}
          </span>

          <span className="text-ink w-[96px] shrink-0 text-right text-[13px] leading-[18px] font-semibold tabular-nums md:w-[130px] md:text-[14.5px] md:leading-[20px]">
            {formatCurrency(item.amount, currency)}
          </span>

          {category.isSystem ? (
            <span className="hidden size-4 shrink-0 md:block" />
          ) : (
            <RowActionsMenu
              label={category.name}
              actions={[
                {
                  label: "Editar",
                  icon: Pencil,
                  onSelect: () => onEdit(category),
                },
                {
                  label: "Eliminar",
                  icon: Trash2,
                  variant: "destructive",
                  onSelect: () => onDelete(category),
                },
              ]}
            />
          )}
        </div>

        <UsageBar
          pct={item.pct}
          color={category.color}
          className="mt-2 w-full md:hidden"
        />
      </div>
    </li>
  );
};
