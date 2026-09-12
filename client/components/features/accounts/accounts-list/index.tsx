"use client";

import { Wallet } from "lucide-react";
import { Amount } from "@/components/common/amount";
import { DataList } from "@/components/common/data-list";
import { DataListItem } from "@/components/common/data-list-item";
import { EmptyState } from "@/components/common/empty-state";
import { StatusBadge } from "@/components/common/status-badge";
import { AccountIcon } from "@/components/features/accounts/account-icon";
import {
  ACCOUNT_TYPE_LABELS,
  ACCOUNT_TYPE_VALUES as TYPE_ORDER,
} from "@/lib/labels";
import type { AccountsListProps } from "./accounts-list.types";

export const AccountsList = ({
  accounts,
  isLoading,
  emptyTitle = "Todavía no tenés cuentas",
  emptyDescription = "Cargá tu primera cuenta para empezar a registrar movimientos.",
}: AccountsListProps) => {
  const ordered = [...accounts].sort(
    (a, b) => TYPE_ORDER.indexOf(a.type) - TYPE_ORDER.indexOf(b.type),
  );

  return (
    <DataList
      data={ordered}
      isLoading={isLoading}
      getRowKey={(account) => account.id}
      emptyState={
        <EmptyState
          icon={Wallet}
          title={emptyTitle}
          description={emptyDescription}
        />
      }
      renderItem={(account) => (
        <DataListItem
          href={`/accounts/detail?id=${account.id}`}
          leading={<AccountIcon type={account.type} />}
          title={account.name}
          subtitle={`${ACCOUNT_TYPE_LABELS[account.type]} · ${account.currency}`}
          trailing={
            <span className="flex flex-col items-end gap-1">
              <Amount
                value={account.currentBalance}
                currency={account.currency}
              />
              {account.archived ? (
                <StatusBadge variant="account" archived />
              ) : account.currentBalance < 0 ? (
                <span className="text-destructive text-xs">Saldo negativo</span>
              ) : null}
            </span>
          }
        />
      )}
    />
  );
};
