"use client";

import { useMemo, useState } from "react";
import { Plus, Search } from "lucide-react";
import { ConfirmActionDialog } from "@/components/common/confirm-action-dialog";
import { PageHeader } from "@/components/common/page-header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useConfirmAction } from "@/hooks/use-confirm-action";
import { useDebounce } from "@/hooks/use-debounce";
import type { Transaction } from "@/lib/api/types";
import { useAccounts } from "@/lib/query/accounts";
import { useCategories } from "@/lib/query/categories";
import {
  useDeleteTransaction,
  useTransactions,
} from "@/lib/query/transactions";
import { TransactionFiltersSheet } from "@/components/features/transactions/transaction-filters-sheet";
import type { TransactionFilterState } from "@/components/features/transactions/transaction-filters-sheet/transaction-filters-sheet.types";
import { TransactionFormDialog } from "@/components/features/transactions/transaction-form-dialog";
import { TransactionList } from "@/components/features/transactions/transaction-list";

const PAGE_SIZE = 10;

const EMPTY_FILTERS: TransactionFilterState = {
  type: "",
  accountId: "",
  categoryId: "",
  from: "",
  to: "",
};

export const TransactionsView = () => {
  const accountsQuery = useAccounts();
  const categoriesQuery = useCategories();
  const deleteTransaction = useDeleteTransaction();

  const [searchInput, setSearchInput] = useState("");
  const search = useDebounce(searchInput, 300);
  const [filters, setFilters] = useState<TransactionFilterState>(EMPTY_FILTERS);
  const [page, setPage] = useState(1);

  const [createOpen, setCreateOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<Transaction | null>(null);

  const deleteAction = useConfirmAction<Transaction>({
    run: (transaction) => deleteTransaction.mutateAsync(transaction.id),
    successMessage: "Movimiento eliminado",
    errorMessage: "No se pudo eliminar",
  });

  const queryFilters = {
    search: search || undefined,
    type: filters.type || undefined,
    accountId: filters.accountId || undefined,
    categoryId: filters.categoryId || undefined,
    from: filters.from || undefined,
    to: filters.to || undefined,
    page,
    pageSize: PAGE_SIZE,
  };

  const transactionsQuery = useTransactions(queryFilters);
  const accounts = useMemo(
    () => accountsQuery.data ?? [],
    [accountsQuery.data],
  );
  const categories = useMemo(
    () => categoriesQuery.data ?? [],
    [categoriesQuery.data],
  );

  const accountNameById = useMemo(
    () => new Map(accounts.map((account) => [account.id, account.name])),
    [accounts],
  );
  const categoryById = useMemo(
    () => new Map(categories.map((category) => [category.id, category])),
    [categories],
  );

  const activeFilterCount = [
    searchInput,
    filters.type,
    filters.accountId,
    filters.categoryId,
    filters.from,
    filters.to,
  ].filter(Boolean).length;

  const response = transactionsQuery.data;

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Movimientos"
        description="Ingresos, gastos y transferencias."
        actions={
          <>
            <TransactionFiltersSheet
              filters={filters}
              onFilterChange={(patch) => {
                setFilters((previous) => ({ ...previous, ...patch }));
                setPage(1);
              }}
              onClear={() => {
                setSearchInput("");
                setFilters(EMPTY_FILTERS);
                setPage(1);
              }}
              accounts={accounts}
              categories={categories}
              activeCount={activeFilterCount}
            />
            <Button
              size="icon"
              aria-label="Nuevo movimiento"
              onClick={() => setCreateOpen(true)}
            >
              <Plus />
            </Button>
          </>
        }
      />

      <div className="relative">
        <Search className="text-muted-foreground absolute top-1/2 left-3 size-4 -translate-y-1/2" />
        <Input
          value={searchInput}
          onChange={(event) => {
            setSearchInput(event.target.value);
            setPage(1);
          }}
          placeholder="Buscar por descripción o notas"
          maxLength={120}
          className="bg-muted/50 h-11 rounded-full border-0 pl-9"
          aria-label="Buscar movimientos"
        />
      </div>

      <TransactionList
        transactions={response?.items ?? []}
        isLoading={transactionsQuery.isLoading}
        accountNameById={accountNameById}
        categoryById={categoryById}
        onSelect={setEditTarget}
        onDelete={deleteAction.request}
        emptyAction={
          <Button size="sm" onClick={() => setCreateOpen(true)}>
            <Plus /> Nuevo movimiento
          </Button>
        }
        pagination={
          response
            ? {
                page: response.page,
                pageSize: response.pageSize,
                total: response.total,
                totalPages: response.totalPages,
                onPageChange: setPage,
              }
            : undefined
        }
      />

      <TransactionFormDialog
        open={createOpen}
        onOpenChange={setCreateOpen}
        accounts={accounts}
        categories={categories}
      />
      <TransactionFormDialog
        key={editTarget?.id ?? "edit"}
        open={Boolean(editTarget)}
        onOpenChange={(open) => {
          if (!open) setEditTarget(null);
        }}
        transaction={editTarget ?? undefined}
        accounts={accounts}
        categories={categories}
      />
      <ConfirmActionDialog
        action={deleteAction}
        title="Eliminar movimiento"
        description={(target) =>
          target.transferGroupId
            ? "Se eliminarán ambos lados de la transferencia. Esta acción no se puede deshacer."
            : "El movimiento se eliminará de forma permanente."
        }
        confirmLabel="Eliminar"
      />
    </div>
  );
};
