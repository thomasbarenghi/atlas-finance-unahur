"use client";

import { useMemo, useState } from "react";
import { useQueryParam } from "@/hooks/use-query-param";
import { monthInputValue } from "@/lib/format";
import { useAccounts } from "@/lib/query/accounts";
import { useBudgets } from "@/lib/query/budgets";
import { useCategories } from "@/lib/query/categories";
import { useTransactions } from "@/lib/query/transactions";

const PAGE_SIZE = 10;

export const useBudgetDetail = () => {
  const budgetId = useQueryParam("id") ?? undefined;
  const periodParam = useQueryParam("period") ?? undefined;
  const [page, setPage] = useState(1);

  const budgetsQuery = useBudgets(
    periodParam ? `${periodParam}-01` : undefined,
  );
  const categoriesQuery = useCategories();
  const accountsQuery = useAccounts();

  const budget = useMemo(
    () => (budgetsQuery.data ?? []).find((item) => item.id === budgetId),
    [budgetsQuery.data, budgetId],
  );
  const month = budget ? monthInputValue(budget.period) : "";

  const transactionsQuery = useTransactions(
    {
      categoryId: budget?.categoryId,
      from: month ? `${month}-01` : undefined,
      to: month ? `${month}-31` : undefined,
      page,
      pageSize: PAGE_SIZE,
    },
    { enabled: Boolean(budget) },
  );

  const categories = useMemo(
    () => categoriesQuery.data ?? [],
    [categoriesQuery.data],
  );
  const accounts = useMemo(
    () => accountsQuery.data ?? [],
    [accountsQuery.data],
  );
  const categoryById = useMemo(
    () => new Map(categories.map((category) => [category.id, category])),
    [categories],
  );
  const accountNameById = useMemo(
    () => new Map(accounts.map((account) => [account.id, account.name])),
    [accounts],
  );

  const response = transactionsQuery.data;
  const pagination = response
    ? {
        page,
        pageSize: PAGE_SIZE,
        total: response.total,
        totalPages: response.totalPages,
        onPageChange: setPage,
      }
    : undefined;

  return {
    budget,
    month,
    categories,
    isLoading: budgetsQuery.isLoading,
    transactions: response?.items ?? [],
    isLoadingTransactions: transactionsQuery.isLoading,
    pagination,
    categoryById,
    accountNameById,
  };
};
