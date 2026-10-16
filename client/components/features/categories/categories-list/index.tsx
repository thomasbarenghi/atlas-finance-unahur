"use client";

import { Tag } from "lucide-react";
import { DataList } from "@/components/common/data-list";
import { DataListItem } from "@/components/common/data-list-item";
import { EmptyState } from "@/components/common/empty-state";
import { CATEGORY_TYPE_LABELS } from "@/lib/labels";
import type { CategoriesListProps } from "./categories-list.types";

export const CategoriesList = ({
  categories,
  isLoading,
}: CategoriesListProps) => {
  return (
    <DataList
      data={categories}
      isLoading={isLoading}
      skeletonCount={3}
      getRowKey={(category) => category.id}
      emptyState={
        <EmptyState
          icon={Tag}
          title="Sin categorías"
          description="No hay categorías para este tipo."
        />
      }
      renderItem={(category) => (
        <DataListItem
          showChevron={false}
          leading={
            <span
              className="size-10 shrink-0 rounded-full"
              style={{ backgroundColor: category.color }}
              aria-hidden
            />
          }
          title={category.name}
          subtitle={CATEGORY_TYPE_LABELS[category.type]}
        />
      )}
    />
  );
};
