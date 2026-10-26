"use client";

import { useMemo, useState } from "react";
import { Plus, Tag, TriangleAlert } from "lucide-react";
import { ConfirmActionDialog } from "@/components/common/confirm-action-dialog";
import { EmptyState } from "@/components/common/empty-state";
import { PageHeader } from "@/components/common/page-header";
import { PeriodSelector } from "@/components/common/period-selector";
import { ResponsiveActionButton } from "@/components/common/responsive-action-button";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useConfirmAction } from "@/hooks/use-confirm-action";
import { useMediaQuery } from "@/hooks/use-media-query";
import { usePeriod } from "@/hooks/use-period";
import type { Category, CategoryType } from "@/lib/api/types";
import { useCategories, useDeleteCategory } from "@/lib/query/categories";
import { useTransactions } from "@/lib/query/transactions";
import { CategoryFormDialog } from "../category-form-dialog";
import { CategoryList } from "./components/category-list";
import { buildCategoryUsage } from "./category-usage";

const TAB_TRIGGER =
  "h-[34px] rounded-full px-4 text-[12px] leading-[16px] font-medium data-active:border data-active:border-border data-active:bg-card data-active:text-foreground data-active:font-semibold";

export const CategoriesView = () => {
  const isDesktop = useMediaQuery("(min-width: 768px)");
  const { range } = usePeriod();
  const categoriesQuery = useCategories();
  const transactionsQuery = useTransactions({ page: 1, pageSize: 100 });
  const deleteCategory = useDeleteCategory();
  const [tab, setTab] = useState<CategoryType>("expense");
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<Category | null>(null);

  const deleteAction = useConfirmAction<Category>({
    run: (category) => deleteCategory.mutateAsync(category.id),
    successMessage: "Categoría eliminada",
    errorMessage: "No se pudo eliminar la categoría",
  });

  const usage = useMemo(
    () =>
      buildCategoryUsage(
        categoriesQuery.data ?? [],
        transactionsQuery.data?.items ?? [],
        tab,
        range,
      ),
    [categoriesQuery.data, transactionsQuery.data, tab, range],
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

  const isLoading = categoriesQuery.isLoading || transactionsQuery.isLoading;
  const isError = categoriesQuery.isError || transactionsQuery.isError;

  const tabs = (
    <TabsList className="bg-secondary grid h-10 w-full grid-cols-2 rounded-full p-[3px] md:flex md:w-fit">
      <TabsTrigger value="expense" className={TAB_TRIGGER}>
        Gastos
      </TabsTrigger>
      <TabsTrigger value="income" className={TAB_TRIGGER}>
        Ingresos
      </TabsTrigger>
    </TabsList>
  );

  return (
    <Tabs
      value={tab}
      onValueChange={(value) => setTab(value as CategoryType)}
      className="flex flex-col gap-4"
    >
      <PageHeader
        title="Categorías"
        description={isDesktop ? "Clasificá tus ingresos y gastos" : undefined}
        titleAddon={
          isDesktop ? null : <PeriodSelector showCalendar display="month" />
        }
        actions={
          <>
            {isDesktop ? <PeriodSelector showCalendar display="month" /> : null}
            {isDesktop ? tabs : null}
            <ResponsiveActionButton
              label="Nueva categoría"
              icon={Plus}
              onClick={openCreate}
            />
          </>
        }
      />

      {isDesktop ? null : <div className="w-full">{tabs}</div>}

      {isError ? (
        <EmptyState
          icon={TriangleAlert}
          title="No pudimos cargar las categorías"
          description="Revisá tu conexión e intentá de nuevo."
          action={
            <Button
              variant="outline"
              onClick={() => {
                categoriesQuery.refetch();
                transactionsQuery.refetch();
              }}
            >
              Reintentar
            </Button>
          }
        />
      ) : isLoading || usage.items.length > 0 ? (
        <CategoryList
          tab={tab}
          usage={usage}
          isLoading={isLoading}
          onEdit={openEdit}
          onDelete={deleteAction.request}
        />
      ) : (
        <EmptyState
          icon={Tag}
          title="Sin categorías"
          description="No hay categorías para este tipo."
          action={
            <Button size="sm" onClick={openCreate}>
              <Plus /> Nueva categoría
            </Button>
          }
        />
      )}

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
    </Tabs>
  );
};
