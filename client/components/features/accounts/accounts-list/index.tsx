"use client";

import { Wallet } from "lucide-react";
import { Amount } from "@/components/common/amount";
import { ArchivedSheet } from "@/components/common/archived-sheet";
import { DataList } from "@/components/common/data-list";
import { DataListItem } from "@/components/common/data-list-item";
import { EmptyState } from "@/components/common/empty-state";
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
  emptyAction,
}: AccountsListProps) => {
  const archived = accounts.filter((account) => account.archived);
  const ordered = accounts
    .filter((account) => !account.archived)
    .sort((a, b) => TYPE_ORDER.indexOf(a.type) - TYPE_ORDER.indexOf(b.type));

  return (
    <div className="flex flex-col gap-2">
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
            subtitle={`${ACCOUNT_TYPE_LABELS[account.type]} · ${account.currency}`}
            trailing={
              <span className="flex flex-col items-end gap-1">
                <Amount
                  value={account.currentBalance}
                  currency={account.currency}
                />
                {account.currentBalance < 0 ? (
                  <span className="text-destructive text-xs">
                    Saldo negativo
                  </span>
                ) : null}
              </span>
            }
          />
        )}
      />
      <ArchivedSheet
        label="cuentas"
        items={archived}
        getKey={(account) => account.id}
        renderItem={(account) => (
          <DataListItem
            href={`/accounts/detail?id=${account.id}`}
            leading={<AccountIcon type={account.type} />}
            title={account.name}
            subtitle={`${ACCOUNT_TYPE_LABELS[account.type]} · ${account.currency}`}
            trailing={
              <Amount
                value={account.currentBalance}
                currency={account.currency}
              />
            }
          />
        )}
      />
    </div>
  );
};
