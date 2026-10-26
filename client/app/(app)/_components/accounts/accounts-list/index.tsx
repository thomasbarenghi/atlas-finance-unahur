"use client";

import type { ReactNode } from "react";
import { Wallet } from "lucide-react";
import { Amount } from "@/components/common/amount";
import { DataList } from "@/components/common/data-list";
import { DataListItem } from "@/components/common/data-list-item";
import { EmptyState } from "@/components/common/empty-state";
import { AccountIcon } from "@/app/(app)/_components/accounts/account-icon";
import {
  ACCOUNT_TYPE_LABELS,
  ACCOUNT_TYPE_VALUES as TYPE_ORDER,
} from "@/lib/labels";
import { CURRENCY } from "@/lib/format";
import type { Account } from "@/lib/api/types";

export interface AccountsListProps {
  accounts: Account[];
  isLoading?: boolean;
  emptyTitle?: string;
  emptyDescription?: string;
  emptyAction?: ReactNode;
}

export const AccountsList = ({
  accounts,
  isLoading,
  emptyTitle = "Todavía no tenés cuentas",
  emptyDescription = "Cargá tu primera cuenta para empezar a registrar movimientos.",
  emptyAction,
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
          action={emptyAction}
        />
      }
      renderItem={(account) => (
        <DataListItem
          href={`/accounts/detail?id=${account.id}`}
          leading={<AccountIcon type={account.type} />}
          title={account.name}
          subtitle={ACCOUNT_TYPE_LABELS[account.type]}
          trailing={
            <span className="flex flex-col items-end gap-1">
              <Amount value={account.currentBalance} currency={CURRENCY} />
              {account.currentBalance < 0 ? (
                <span className="text-destructive text-xs">Saldo negativo</span>
              ) : null}
            </span>
          }
        />
      )}
    />
  );
};
