"use client";

import { Archive, Pencil, Tag } from "lucide-react";
import { ArchivedSheet } from "@/components/common/archived-sheet";
import { DataList } from "@/components/common/data-list";
import { DataListItem } from "@/components/common/data-list-item";
import { EmptyState } from "@/components/common/empty-state";
import { RowActionsMenu } from "@/components/common/row-actions-menu";
import { Badge } from "@/components/ui/badge";
import { CATEGORY_TYPE_LABELS } from "@/lib/labels";
import type { CategoriesListProps } from "./categories-list.types";

export const CategoriesList = ({
  categories,
  isLoading,
  onEdit,
  onArchive,
}: CategoriesListProps) => {
  const archived = categories.filter((category) => category.archived);

  return (
    <div className="flex flex-col gap-2">
      <DataList
        data={categories.filter((category) => !category.archived)}
        isLoading={isLoading}
        skeletonCount={3}
        getRowKey={(category) => category.id}
        emptyState={
          <EmptyState
            icon={Tag}
            title="Sin categorías"
            description="Creá categorías propias para clasificar tus movimientos."
          />
        }
        renderItem={(category) => (
          <DataListItem
            onClick={category.isSystem ? undefined : () => onEdit(category)}
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
            trailing={
              category.isSystem ? (
                <Badge variant="secondary">Sistema</Badge>
              ) : undefined
            }
            trailingAction={
              category.isSystem ? undefined : (
                <RowActionsMenu
                  label={category.name}
                  actions={[
                    {
                      label: "Editar",
                      icon: Pencil,
                      onSelect: () => onEdit(category),
                    },
                    {
                      label: "Archivar",
                      icon: Archive,
                      variant: "destructive",
                      onSelect: () => onArchive(category),
                    },
                  ]}
                />
              )
            }
          />
        )}
      />
      <ArchivedSheet
        label="categorías"
        items={archived}
        getKey={(category) => category.id}
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
    </div>
  );
};
