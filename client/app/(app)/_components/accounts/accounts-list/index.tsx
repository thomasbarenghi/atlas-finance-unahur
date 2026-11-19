"use client";

import type { ReactNode } from "react";
import Link from "next/link";
import { ChevronRight, Wallet } from "lucide-react";
import { Amount } from "@/components/common/amount";
import { EmptyState } from "@/components/common/empty-state";
import { ListSkeleton } from "@/components/common/list-skeleton";
import { AccountIcon } from "@/app/(app)/_components/accounts/account-icon";
import { currencyGroupLabel, groupAccountsByCurrency } from "@/lib/currency";
import { formatCurrency } from "@/lib/format";
import {
  ACCOUNT_TYPE_LABELS,
  ACCOUNT_TYPE_VALUES as TYPE_ORDER,
} from "@/lib/labels";
import type { Account } from "@/lib/api/types";

export interface AccountsListProps {
  accounts: Account[];
  isLoading?: boolean;
  emptyAction?: ReactNode;
  groupByCurrency?: boolean;
  primaryCurrency?: string;
}

const EMPTY_TITLE = "Todavía no tenés cuentas";
const EMPTY_DESCRIPTION =
  "Cargá tu primera cuenta para empezar a registrar movimientos.";

export const AccountsList = ({
  accounts,
  isLoading,
  emptyAction,
  groupByCurrency = false,
  primaryCurrency = "ARS",
}: AccountsListProps) => {
  const ordered = [...accounts].sort(
    (a, b) => TYPE_ORDER.indexOf(a.type) - TYPE_ORDER.indexOf(b.type),
  );

  if (!isLoading && ordered.length === 0) {
    return (
      <EmptyState
        icon={Wallet}
        title={EMPTY_TITLE}
        description={EMPTY_DESCRIPTION}
        action={emptyAction}
      />
    );
  }

  const renderAccount = (account: Account) => (
    <li key={account.id}>
      <Link
        href={`/accounts/detail?id=${account.id}`}
        className="hover:bg-muted/40 active:bg-muted/60 flex w-full items-center gap-2.5 px-3.5 py-[12.5px] text-left transition-colors md:gap-3 md:px-[18px] md:py-[13px]"
      >
        <AccountIcon type={account.type} />
        <div className="min-w-0 flex-1">
          <div className="text-ink truncate text-[12.5px] leading-[17px] font-semibold md:text-sm md:leading-[19px]">
            {account.name}
          </div>
          <div className="text-muted-foreground line-clamp-2 text-[10px] leading-[14px] md:mt-px md:text-[11.5px] md:leading-[16px]">
            {ACCOUNT_TYPE_LABELS[account.type]}
          </div>
        </div>
        <div className="shrink-0 text-right">
          <span className="flex flex-col items-end gap-1">
            <Amount
              value={account.currentBalance}
              currency={account.currency}
              className="text-[12.5px] leading-[17px] font-semibold md:text-[14px] md:leading-[19px]"
            />
            {account.currentBalance < 0 ? (
              <span className="text-destructive text-[10.5px]">
                Saldo negativo
              </span>
            ) : null}
          </span>
        </div>
        <ChevronRight
          className="text-muted-foreground size-[14px] shrink-0 md:size-[15px]"
          aria-hidden
        />
      </Link>
    </li>
  );

  if (isLoading) {
    return (
      <div className="surface-list rounded-[18px] py-0.5 md:rounded-3xl md:py-1">
        <ListSkeleton rows={5} />
      </div>
    );
  }

  if (!groupByCurrency) {
    return (
      <div className="surface-list rounded-[18px] py-0.5 md:rounded-3xl md:py-1">
        <ul className="divide-line2 divide-y">{ordered.map(renderAccount)}</ul>
      </div>
    );
  }

  const groups = groupAccountsByCurrency(accounts, primaryCurrency);

  return (
    <div className="surface-list overflow-hidden rounded-[18px] md:rounded-3xl">
      {groups.map((group, groupIndex) => (
        <section
          key={group.currency}
          className={groupIndex > 0 ? "border-line2 border-t" : undefined}
        >
          <header className="bg-[#F9FAFB] dark:bg-muted/40 flex h-9 items-center justify-between gap-3 px-3.5 md:px-[18px]">
            <span className="text-muted-foreground text-[10px] leading-[14px] font-bold tracking-[0.12em] uppercase">
              {currencyGroupLabel(group.currency)} · {group.currency}
            </span>
            <span className="text-ink text-[11px] leading-[15px] font-semibold tabular-nums md:text-[12px] md:leading-[16px]">
              {formatCurrency(group.total, group.currency, undefined, {
                showCents: false,
              })}
            </span>
          </header>
          <ul className="divide-line2 divide-y">
            {group.accounts
              .slice()
              .sort(
                (a, b) =>
                  TYPE_ORDER.indexOf(a.type) - TYPE_ORDER.indexOf(b.type),
              )
              .map(renderAccount)}
          </ul>
        </section>
      ))}
    </div>
  );
};
