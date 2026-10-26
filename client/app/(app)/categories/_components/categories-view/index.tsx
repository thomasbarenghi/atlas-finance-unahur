"use client";

import { useState } from "react";
import { Pencil, Plus, Tag, Trash2 } from "lucide-react";
import { ConfirmActionDialog } from "@/components/common/confirm-action-dialog";
import { DataList } from "@/components/common/data-list";
import { DataListItem } from "@/components/common/data-list-item";
import { EmptyState } from "@/components/common/empty-state";
import { PageHeader } from "@/components/common/page-header";
import { RowActionsMenu } from "@/components/common/row-actions-menu";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useConfirmAction } from "@/hooks/use-confirm-action";
import type { Category, CategoryType } from "@/lib/api/types";
import { sortCategories } from "@/lib/categories";
import { CATEGORY_TYPE_LABELS } from "@/lib/labels";
import { useCategories, useDeleteCategory } from "@/lib/query/categories";
import { CategoryFormDialog } from "../category-form-dialog";

export const CategoriesView = () => {
  const categoriesQuery = useCategories();
  const deleteCategory = useDeleteCategory();
  const [tab, setTab] = useState<CategoryType>("expense");
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<Category | null>(null);

  const deleteAction = useConfirmAction<Category>({
    run: (category) => deleteCategory.mutateAsync(category.id),
    successMessage: "Categoría eliminada",
    errorMessage: "No se pudo eliminar la categoría",
  });

  const categories = categoriesQuery.data ?? [];
  const expenses = sortCategories(
    categories.filter((category) => category.type === "expense"),
  );
  const incomes = sortCategories(
    categories.filter((category) => category.type === "income"),
  );

  const openCreate = () => {
    setEditing(null);
    setFormOpen(true);
  };

  const openEdit = (category: Category) => {
    setEditing(category);
    setFormOpen(true);
  };

  const handleFormOpenChange = (open: boolean) => {
    setFormOpen(open);
    if (!open) setEditing(null);
  };

  const renderList = (list: Category[]) => (
    <DataList
      data={list}
      isLoading={categoriesQuery.isLoading}
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
          subtitle={
            category.isSystem
              ? `${CATEGORY_TYPE_LABELS[category.type]} · Del sistema`
              : CATEGORY_TYPE_LABELS[category.type]
          }
          trailingAction={
            category.isSystem ? undefined : (
              <RowActionsMenu
                label={category.name}
                actions={[
                  {
                    label: "Editar",
                    icon: Pencil,
                    onSelect: () => openEdit(category),
                  },
                  {
                    label: "Eliminar",
                    icon: Trash2,
                    variant: "destructive",
                    onSelect: () => deleteAction.request(category),
                  },
                ]}
              />
            )
          }
        />
      )}
    />
  );

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Categorías"
        description="Categorías del sistema y propias para clasificar tus ingresos y gastos."
        actions={
          <Button size="icon" aria-label="Nueva categoría" onClick={openCreate}>
            <Plus />
          </Button>
        }
      />

      <Tabs
        value={tab}
        onValueChange={(value) => setTab(value as CategoryType)}
      >
        <TabsList>
          <TabsTrigger value="expense">Gastos</TabsTrigger>
          <TabsTrigger value="income">Ingresos</TabsTrigger>
        </TabsList>
        <TabsContent value="expense" className="pt-4">
          {renderList(expenses)}
        </TabsContent>
        <TabsContent value="income" className="pt-4">
          {renderList(incomes)}
        </TabsContent>
      </Tabs>

      <CategoryFormDialog
        open={formOpen}
        onOpenChange={handleFormOpenChange}
        category={editing}
        initialType={tab}
        onSaved={(saved) => setTab(saved.type)}
      />

      <ConfirmActionDialog
        action={deleteAction}
        title="Eliminar categoría"
        description={(category) =>
          `¿Eliminar "${category.name}"? Los movimientos que la usaban quedarán sin categoría.`
        }
        confirmLabel="Eliminar"
      />
    </div>
  );
};
