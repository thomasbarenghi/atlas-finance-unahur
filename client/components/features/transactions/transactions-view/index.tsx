"use client";

import { useMemo, useState } from "react";
import { Plus } from "lucide-react";
import { ConfirmActionDialog } from "@/components/common/confirm-action-dialog";
import { PageHeader } from "@/components/common/page-header";
import { Button } from "@/components/ui/button";
import { useConfirmAction } from "@/hooks/use-confirm-action";
import { useDebounce } from "@/hooks/use-debounce";
import type { Transaction } from "@/lib/api/types";
import { useAccounts } from "@/lib/query/accounts";
import { useCategories } from "@/lib/query/categories";
import {
  useDeleteTransaction,
  useTransactions,
} from "@/lib/query/transactions";
import { TransactionFilters } from "@/components/features/transactions/transaction-filters";
import { TransactionFormDialog } from "@/components/features/transactions/transaction-form-dialog";
import { TransactionList } from "@/components/features/transactions/transaction-list";

const PAGE_SIZE = 10;

export const TransactionsView = () => {
  const accountsQuery = useAccounts();
  const categoriesQuery = useCategories();
  const deleteTransaction = useDeleteTransaction();

  const [searchInput, setSearchInput] = useState("");
  const search = useDebounce(searchInput, 300);
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

  const response = transactionsQuery.data;

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Movimientos"
        description="Ingresos, gastos y transferencias."
        actions={
          <Button
            size="icon"
            aria-label="Nuevo movimiento"
            onClick={() => setCreateOpen(true)}
          >
            <Plus />
          </Button>
        }
      />

      <TransactionFilters
        search={searchInput}
        onSearchChange={(value) => {
          setSearchInput(value);
          setPage(1);
        }}
      />

      <TransactionList
        transactions={response?.items ?? []}
        isLoading={transactionsQuery.isLoading}
        accountNameById={accountNameById}
        categoryById={categoryById}
        onSelect={setEditTarget}
        onDelete={deleteAction.request}
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
