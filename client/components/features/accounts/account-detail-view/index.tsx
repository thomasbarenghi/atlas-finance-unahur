"use client";

import { useMemo, useState } from "react";
import { Archive, ArchiveRestore, Pencil, Wallet } from "lucide-react";
import { Amount } from "@/components/common/amount";
import { ConfirmActionDialog } from "@/components/common/confirm-action-dialog";
import {
  DetailPage,
  DetailPageNotFound,
  DetailPageSkeleton,
} from "@/components/common/detail-page";
import { DetailMetric } from "@/components/common/detail-metric";
import { RowActionsMenu } from "@/components/common/row-actions-menu";
import { StatusBadge } from "@/components/common/status-badge";
import { Button } from "@/components/ui/button";
import { useConfirmAction } from "@/hooks/use-confirm-action";
import type { Account, Transaction } from "@/lib/api/types";
import { formatDate } from "@/lib/format";
import { ACCOUNT_TYPE_LABELS } from "@/lib/labels";
import { useArchiveAccount, useRestoreAccount } from "@/lib/query/accounts";
import { useCategories } from "@/lib/query/categories";
import { AccountFormDialog } from "@/components/features/accounts/account-form-dialog";
import { AccountIcon } from "@/components/features/accounts/account-icon";
import { TransactionFormDialog } from "@/components/features/transactions/transaction-form-dialog";
import { TransactionList } from "@/components/features/transactions/transaction-list";
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
    range,
  } = useAccountDetail();
  const categoriesQuery = useCategories();
  const archiveAccount = useArchiveAccount();
  const restoreAccount = useRestoreAccount();

  const [editOpen, setEditOpen] = useState(false);
  const [editTransaction, setEditTransaction] = useState<Transaction | null>(
    null,
  );

  const archiveAction = useConfirmAction<Account>({
    run: (target) =>
      target.archived
        ? restoreAccount.mutateAsync(target.id)
        : archiveAccount.mutateAsync(target.id),
    successMessage: (target) =>
      target.archived ? "Cuenta restaurada" : "Cuenta archivada",
    errorMessage: "No se pudo actualizar la cuenta",
  });

  const categories = useMemo(
    () => categoriesQuery.data ?? [],
    [categoriesQuery.data],
  );
  const accountNameById = useMemo(
    () => new Map(accounts.map((item) => [item.id, item.name])),
    [accounts],
  );
  const categoryById = useMemo(
    () => new Map(categories.map((category) => [category.id, category])),
    [categories],
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
      description={`${ACCOUNT_TYPE_LABELS[account.type]} · ${account.currency}`}
      actions={
        <>
          <Button
            variant="outline"
            size="icon"
            aria-label="Editar cuenta"
            onClick={() => setEditOpen(true)}
          >
            <Pencil />
          </Button>
          <RowActionsMenu
            label={account.name}
            triggerLabel="Más acciones"
            actions={[
              account.archived
                ? {
                    label: "Restaurar",
                    icon: ArchiveRestore,
                    onSelect: () => archiveAction.request(account),
                  }
                : {
                    label: "Archivar",
                    icon: Archive,
                    variant: "destructive",
                    onSelect: () => archiveAction.request(account),
                  },
            ]}
          />
        </>
      }
    >
      <div className="from-primary/10 to-background flex flex-col items-center gap-3 rounded-2xl border bg-gradient-to-b p-6 text-center">
        <AccountIcon type={account.type} className="size-14 [&_svg]:size-7" />
        <div className="flex flex-col gap-1">
          <span className="text-muted-foreground text-sm">{account.name}</span>
          <Amount
            value={account.currentBalance}
            currency={account.currency}
            className="font-heading text-3xl font-bold sm:text-4xl"
          />
        </div>
        <StatusBadge variant="account" archived={account.archived} />
      </div>

      <div className="grid grid-cols-3 gap-3">
        <DetailMetric
          label="Saldo inicial"
          value={
            <Amount
              value={account.initialBalance}
              currency={account.currency}
              className="font-normal"
            />
          }
        />
        <DetailMetric
          label="Ingresos"
          value={
            <Amount
              value={summary.income}
              currency={account.currency}
              type="income"
            />
          }
        />
        <DetailMetric
          label="Gastos"
          value={
            <Amount
              value={summary.expense}
              currency={account.currency}
              type="expense"
            />
          }
        />
      </div>

      <section className="flex flex-col gap-3">
        <div className="flex items-center justify-between gap-2">
          <h2 className="font-heading text-base font-semibold">
            Movimientos
            <span className="text-muted-foreground font-normal">
              {" "}
              ({movementCount})
            </span>
          </h2>
          <span className="text-muted-foreground text-xs">
            {formatDate(range.from)} – {formatDate(range.to)}
          </span>
        </div>
        <TransactionList
          transactions={transactions}
          isLoading={isLoadingTransactions}
          accountNameById={accountNameById}
          categoryById={categoryById}
          onSelect={setEditTransaction}
        />
      </section>

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
        action={archiveAction}
        title={(target) =>
          target.archived ? "Restaurar cuenta" : "Archivar cuenta"
        }
        description={(target) =>
          target.archived
            ? `La cuenta "${target.name}" volverá a estar disponible para nuevos movimientos.`
            : `La cuenta "${target.name}" conservará su historial y no admitirá nuevos movimientos.`
        }
        confirmLabel={(target) => (target.archived ? "Restaurar" : "Archivar")}
        variant={(target) => (target.archived ? "default" : "destructive")}
      />
    </DetailPage>
  );
};
