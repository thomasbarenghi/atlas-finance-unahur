"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { ChevronRight, Pencil, Trash2, Wallet } from "lucide-react";
import { ConfirmActionDialog } from "@/components/common/confirm-action-dialog";
import { Button } from "@/components/ui/button";
import { useConfirmAction } from "@/hooks/use-confirm-action";
import type { Account, Transaction } from "@/lib/api/types";
import { useDeleteAccount } from "@/lib/query/accounts";
import { useCategories } from "@/lib/query/categories";
import { AccountFormDialog } from "@/app/(app)/_components/accounts/account-form-dialog";
import { DeleteTransactionDialog } from "@/app/(app)/_components/transactions/delete-transaction-dialog";
import { useDeleteTransactionAction } from "@/app/(app)/_components/transactions/hooks/use-delete-transaction-action";
import { buildTransactionLookups } from "@/app/(app)/_components/transactions/transaction-lookups";
import { TransactionFormDialog } from "@/app/(app)/_components/transactions/transaction-form-dialog";
import { TransactionList } from "@/app/(app)/_components/transactions/transaction-list";
import { AccountBalanceCard } from "./components/account-balance-card";
import { AccountMetrics } from "./components/account-metrics";
import {
  DetailPage,
  DetailPageNotFound,
  DetailPageSkeleton,
} from "./components/detail-page";
import { useAccountDetail } from "./hooks/use-account-detail";

export const AccountDetailView = () => {
  const {
    account,
    accounts,
    isLoading,
    transactions,
    isLoadingTransactions,
    movementCount,
    summary,
  } = useAccountDetail();
  const categoriesQuery = useCategories();
  const deleteAccount = useDeleteAccount();

  const [editOpen, setEditOpen] = useState(false);
  const [editTransaction, setEditTransaction] = useState<Transaction | null>(
    null,
  );

  const deleteAccountAction = useConfirmAction<Account>({
    run: (target) => deleteAccount.mutateAsync(target.id),
    successMessage: "Cuenta eliminada",
    errorMessage: "No se pudo eliminar la cuenta",
  });

  const deleteTransactionAction = useDeleteTransactionAction();

  const categories = categoriesQuery.data ?? [];
  const { accountNameById, categoryNameById } = useMemo(
    () => buildTransactionLookups(accounts, categoriesQuery.data ?? []),
    [accounts, categoriesQuery.data],
  );

  if (isLoading) {
    return <DetailPageSkeleton />;
  }

  if (!account) {
    return (
      <DetailPageNotFound
        entityLabel="Cuenta"
        icon={Wallet}
        title="Cuenta no encontrada"
        description="La cuenta que buscás no existe o fue eliminada."
      />
    );
  }

  return (
    <DetailPage
      title={account.name}
      titleSize="compact"
      actions={
        <>
          <Button
            variant="outline"
            aria-label="Editar cuenta"
            onClick={() => setEditOpen(true)}
            className="bg-card hover:bg-card text-ink2 size-10 gap-2 rounded-full border px-0 text-[12.5px] leading-[17px] font-semibold md:w-auto md:px-4"
          >
            <Pencil className="size-4 md:size-[15px]" aria-hidden />
            <span className="hidden md:inline">Editar</span>
          </Button>
          <Button
            variant="outline"
            aria-label="Eliminar cuenta"
            onClick={() => deleteAccountAction.request(account)}
            className="bg-card hover:bg-card text-expense size-10 gap-2 rounded-full border px-0 text-[12.5px] leading-[17px] font-semibold md:w-auto md:px-4"
          >
            <Trash2 className="size-4 md:size-[15px]" aria-hidden />
            <span className="hidden md:inline">Eliminar</span>
          </Button>
        </>
      }
    >
      <AccountBalanceCard account={account} />
      <AccountMetrics account={account} summary={summary} />

      <TransactionList
        transactions={transactions.slice(0, 5)}
        isLoading={isLoadingTransactions}
        contextAccountId={account.id}
        accountNameById={accountNameById}
        categoryNameById={categoryNameById}
        compact
        onSelect={setEditTransaction}
        onDelete={deleteTransactionAction.request}
        header={
          <div className="flex items-center justify-between gap-3">
            <h2 className="text-ink font-heading text-[13.5px] leading-[17px] font-semibold md:text-[14.5px] md:leading-[18px]">
              Movimientos ({movementCount})
            </h2>
            <Link
              href="/transactions"
              className="text-primary flex items-center gap-1 text-[10.5px] leading-[14px] font-semibold md:text-[11.5px] md:leading-[16px]"
            >
              Ver todos
              <ChevronRight className="size-3 md:size-[13px]" aria-hidden />
            </Link>
          </div>
        }
      />

      <AccountFormDialog
        key={account.id}
        open={editOpen}
        onOpenChange={setEditOpen}
        account={account}
      />
      <TransactionFormDialog
        key={editTransaction?.id ?? "edit-transaction"}
        open={Boolean(editTransaction)}
        onOpenChange={(open) => {
          if (!open) setEditTransaction(null);
        }}
        transaction={editTransaction ?? undefined}
        accounts={accounts}
        categories={categories}
      />
      <ConfirmActionDialog
        action={deleteAccountAction}
        title="Eliminar cuenta"
        description={(target) =>
          `Se eliminará «${target.name}» junto con ${movementCount} ${
            movementCount === 1 ? "movimiento" : "movimientos"
          }.${
            target.currentBalance > 0
              ? " Si todavía tiene saldo, transferilo antes a otra cuenta."
              : ""
          } Esta acción no se puede deshacer.`
        }
        confirmLabel="Eliminar"
      />
      <DeleteTransactionDialog action={deleteTransactionAction} />
    </DetailPage>
  );
};
