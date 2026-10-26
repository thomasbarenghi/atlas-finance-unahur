"use client";

import type { ReactNode } from "react";
import Link from "next/link";
import { ChevronRight, Wallet } from "lucide-react";
import { Amount } from "@/components/common/amount";
import { EmptyState } from "@/components/common/empty-state";
import { ListSkeleton } from "@/components/common/list-skeleton";
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
  emptyAction?: ReactNode;
}

const EMPTY_TITLE = "Todavía no tenés cuentas";
const EMPTY_DESCRIPTION =
  "Cargá tu primera cuenta para empezar a registrar movimientos.";

export const AccountsList = ({
  accounts,
  isLoading,
  emptyAction,
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

  return (
    <div className="surface-list rounded-[18px] py-0.5 md:rounded-3xl md:py-1">
      {isLoading ? (
        <ListSkeleton rows={5} />
      ) : (
        <ul className="divide-line2 divide-y">
          {ordered.map((account) => (
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
                      currency={CURRENCY}
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
          ))}
        </ul>
      )}
    </div>
  );
};
