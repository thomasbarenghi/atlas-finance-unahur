"use client";

import { useMemo, useState } from "react";
import { Plus } from "lucide-react";
import { ConfirmActionDialog } from "@/components/common/confirm-action-dialog";
import { PageHeader } from "@/components/common/page-header";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useConfirmAction } from "@/hooks/use-confirm-action";
import type { Category, CategoryType } from "@/lib/api/types";
import { sortCategories } from "@/lib/categories";
import { useArchiveCategory, useCategories } from "@/lib/query/categories";
import { CategoriesList } from "@/components/features/categories/categories-list";
import { CategoryFormDialog } from "@/components/features/categories/category-form-dialog";

interface CategoryDialogState {
  category?: Category;
  type?: CategoryType;
}

export const CategoriesView = () => {
  const categoriesQuery = useCategories();
  const archiveCategory = useArchiveCategory();

  const [tab, setTab] = useState<CategoryType>("expense");
  const [dialog, setDialog] = useState<CategoryDialogState | null>(null);

  const archiveAction = useConfirmAction<Category>({
    run: (category) => archiveCategory.mutateAsync(category.id),
    successMessage: "Categoría archivada",
    errorMessage: "No se pudo archivar",
  });

  const categories = useMemo(
    () => categoriesQuery.data ?? [],
    [categoriesQuery.data],
  );
  const expenses = sortCategories(
    categories.filter((category) => category.type === "expense"),
  );
  const incomes = sortCategories(
    categories.filter((category) => category.type === "income"),
  );

  const renderList = (list: Category[]) => (
    <CategoriesList
      categories={list}
      isLoading={categoriesQuery.isLoading}
      onEdit={(category) => setDialog({ category })}
      onArchive={archiveAction.request}
    />
  );

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Categorías"
        description="Clasificá tus ingresos y gastos."
        actions={
          <Button
            size="icon"
            aria-label="Nueva categoría"
            onClick={() => setDialog({ type: tab })}
          >
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
        key={dialog?.category?.id ?? dialog?.type ?? "category-new"}
        open={Boolean(dialog)}
        onOpenChange={(open) => {
          if (!open) setDialog(null);
        }}
        category={dialog?.category}
        initialType={dialog?.type}
      />
      <ConfirmActionDialog
        action={archiveAction}
        title="Archivar categoría"
        description={(target) =>
          `La categoría "${target.name}" dejará de estar disponible para nuevos movimientos.`
        }
        confirmLabel="Archivar"
      />
    </div>
  );
};
