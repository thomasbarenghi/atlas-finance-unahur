"use client";

import { useMemo, useState } from "react";
import { usePeriod } from "@/hooks/use-period";
import { buildTransactionLookups } from "@/app/(app)/_components/transactions/transaction-lookups";
import { useAccounts } from "@/lib/query/accounts";
import { useCategories } from "@/lib/query/categories";
import { useTransactions } from "@/lib/query/transactions";
import { collapseTransfers } from "@/app/(app)/_components/transactions/transaction-list/transaction-list.utils";
import { filterTransactions, type TransactionTypeFilter } from "../filters";

const PAGE_SIZE = 10;

export const useTransactionFilters = () => {
  const { preset, range, setPreset } = usePeriod();
  const accountsQuery = useAccounts();
  const categoriesQuery = useCategories();
  const transactionsQuery = useTransactions({ page: 1, pageSize: 100 });

  const [search, setSearchState] = useState("");
  const [type, setTypeState] = useState<TransactionTypeFilter>("all");
  const [accountId, setAccountIdState] = useState("");
  const [categoryId, setCategoryIdState] = useState("");
  const [page, setPage] = useState(1);

  const accounts = accountsQuery.data ?? [];
  const categories = categoriesQuery.data ?? [];

  const { accountNameById, categoryNameById } = useMemo(
    () =>
      buildTransactionLookups(
        accountsQuery.data ?? [],
        categoriesQuery.data ?? [],
      ),
    [accountsQuery.data, categoriesQuery.data],
  );

  const filtered = useMemo(
    () =>
      filterTransactions(transactionsQuery.data?.items ?? [], {
        search,
        type,
        accountId,
        categoryId,
        range,
        categoryNameById,
      }),
    [
      transactionsQuery.data,
      search,
      type,
      accountId,
      categoryId,
      range,
      categoryNameById,
    ],
  );

  const collapsed = useMemo(() => collapseTransfers(filtered), [filtered]);
  const totalPages = Math.max(1, Math.ceil(collapsed.length / PAGE_SIZE));
  const safePage = Math.min(page, totalPages);
  const pageItems = collapsed.slice(
    (safePage - 1) * PAGE_SIZE,
    safePage * PAGE_SIZE,
  );

  const resetPage = () => setPage(1);

  const setSearch = (value: string) => {
    setSearchState(value);
    resetPage();
  };
  const setType = (value: TransactionTypeFilter) => {
    setTypeState(value);
    resetPage();
  };
  const setAccountId = (value: string) => {
    setAccountIdState(value);
    resetPage();
  };
  const setCategoryId = (value: string) => {
    setCategoryIdState(value);
    resetPage();
  };

  const clearFilters = () => {
    setSearchState("");
    setTypeState("all");
    setAccountIdState("");
    setCategoryIdState("");
    setPage(1);
  };

  const hasActiveFilters =
    search !== "" || type !== "all" || accountId !== "" || categoryId !== "";

  return {
    accounts,
    categories,
    accountNameById,
    categoryNameById,
    filtered,
    pageItems,
    total: collapsed.length,
    page: safePage,
    pageSize: PAGE_SIZE,
    totalPages,
    setPage,
    search,
    setSearch,
    type,
    setType,
    accountId,
    setAccountId,
    categoryId,
    setCategoryId,
    preset,
    setPreset,
    range,
    hasActiveFilters,
    clearFilters,
    isLoading:
      transactionsQuery.isLoading ||
      accountsQuery.isLoading ||
      categoriesQuery.isLoading,
  };
};
