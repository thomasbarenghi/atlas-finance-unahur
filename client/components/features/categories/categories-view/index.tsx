"use client";

import { useMemo, useState } from "react";
import { PageHeader } from "@/components/common/page-header";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import type { Category, CategoryType } from "@/lib/api/types";
import { sortCategories } from "@/lib/categories";
import { useCategories } from "@/lib/query/categories";
import { CategoriesList } from "@/components/features/categories/categories-list";

export const CategoriesView = () => {
  const categoriesQuery = useCategories();
  const [tab, setTab] = useState<CategoryType>("expense");

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
    <CategoriesList categories={list} isLoading={categoriesQuery.isLoading} />
  );

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Categorías"
        description="Catálogo fijo para clasificar tus ingresos y gastos."
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
    </div>
  );
};
