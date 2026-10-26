"use client";

import { useState } from "react";
import { Download, Plus } from "lucide-react";
import { PageHeader } from "@/components/common/page-header";
import { ResponsiveActionButton } from "@/components/common/responsive-action-button";
import { Button } from "@/components/ui/button";
import { useExportTransactions } from "@/hooks/use-export-transactions";
import type { Transaction } from "@/lib/api/types";
import { DeleteTransactionDialog } from "@/app/(app)/_components/transactions/delete-transaction-dialog";
import { useDeleteTransactionAction } from "@/app/(app)/_components/transactions/hooks/use-delete-transaction-action";
import { TransactionFormDialog } from "@/app/(app)/_components/transactions/transaction-form-dialog";
import { TransactionList } from "@/app/(app)/_components/transactions/transaction-list";
import { TransactionFilters } from "./components/transaction-filters";
import { useTransactionFilters } from "./hooks/use-transaction-filters";

export const TransactionsView = () => {
  const {
    accounts,
    categories,
    accountNameById,
    categoryNameById,
    filtered,
    pageItems,
    total,
    page,
    pageSize,
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
    isLoading,
  } = useTransactionFilters();
  const { exportTransactions } = useExportTransactions();

  const [createOpen, setCreateOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<Transaction | null>(null);

  const deleteAction = useDeleteTransactionAction();

  const exportCsv = () => exportTransactions(filtered);

  return (
    <div className="flex flex-col gap-3.5 md:gap-4">
      <PageHeader
        title="Movimientos"
        description="Ingresos, gastos y transferencias"
        actions={
          <>
            <Button
              variant="outline"
              onClick={exportCsv}
              disabled={filtered.length === 0}
              className="bg-card hover:bg-card text-ink2 hidden h-10 gap-2 rounded-full border px-4 text-[12.5px] leading-[17px] font-semibold md:inline-flex"
            >
              <Download className="size-4" aria-hidden />
              Exportar
            </Button>
            <ResponsiveActionButton
              label="Nuevo movimiento"
              icon={Plus}
              onClick={() => setCreateOpen(true)}
            />
          </>
        }
      />

      <TransactionFilters
        search={search}
        onSearchChange={setSearch}
        type={type}
        onTypeChange={setType}
        accountId={accountId}
        onAccountChange={setAccountId}
        categoryId={categoryId}
        onCategoryChange={setCategoryId}
        preset={preset}
        range={range}
        onPresetChange={setPreset}
        accounts={accounts}
        categories={categories}
        hasActiveFilters={hasActiveFilters}
        onClear={clearFilters}
      />

      <TransactionList
        transactions={pageItems}
        isLoading={isLoading}
        accountNameById={accountNameById}
        categoryNameById={categoryNameById}
        groupByMonth
        onSelect={setEditTarget}
        onDelete={deleteAction.request}
        emptyAction={
          <Button size="sm" onClick={() => setCreateOpen(true)}>
            <Plus /> Nuevo movimiento
          </Button>
        }
        pagination={{
          page,
          pageSize,
          total,
          totalPages,
          onPageChange: setPage,
        }}
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
      <DeleteTransactionDialog action={deleteAction} />
    </div>
  );
};
