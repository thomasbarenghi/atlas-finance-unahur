"use client";

import Link from "next/link";
import { Plus } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import {
  AccountCreation,
  useAccountCreation,
} from "@/app/(app)/_components/accounts/account-creation";
import { ACCOUNT_TYPE_ICONS } from "@/app/(app)/_components/accounts/account-icon";
import { useAuth } from "@/hooks/use-auth";
import { groupAccountsByCurrency } from "@/lib/currency";
import { formatCurrency } from "@/lib/format";
import { useAccounts } from "@/lib/query/accounts";

export const SidebarAccounts = () => {
  const { user } = useAuth();
  const accountsQuery = useAccounts();
  const creation = useAccountCreation();
  const accounts = accountsQuery.data ?? [];
  const primaryCurrency = user?.primaryCurrency ?? "ARS";
  const groups = groupAccountsByCurrency(accounts, primaryCurrency);
  const orderedAccounts = groups.flatMap((group) => group.accounts);

  return (
    <section className="flex flex-col pt-[26px]" aria-label="Cuentas">
      <div className="flex h-[26px] items-center justify-between px-2.5">
        <span className="text-muted-foreground text-[10px] leading-[14px] font-bold tracking-[0.11em] uppercase">
          Cuentas
        </span>
        <button
          type="button"
          aria-label="Nueva cuenta"
          onClick={creation.openPicker}
          className="text-muted-foreground hover:text-primary focus-visible:ring-ring rounded-md p-1 transition-colors focus-visible:ring-2 focus-visible:outline-none"
        >
          <Plus className="size-3.5" aria-hidden />
        </button>
      </div>

      <div className="flex flex-col">
        {accountsQuery.isLoading ? (
          Array.from({ length: 3 }).map((_, index) => (
            <div
              key={index}
              className="flex h-[42px] items-center gap-2 px-2.5"
            >
              <Skeleton className="size-4 rounded-md" />
              <Skeleton className="h-3 flex-1" />
              <Skeleton className="h-3 w-14" />
            </div>
          ))
        ) : accounts.length === 0 ? (
          <p className="text-muted-foreground px-2.5 py-2 text-xs">
            Todavía no hay cuentas.
          </p>
        ) : (
          orderedAccounts.map((account) => {
            const Icon = ACCOUNT_TYPE_ICONS[account.type];
            return (
              <Link
                key={account.id}
                href={`/accounts/detail?id=${account.id}`}
                className="text-ink2 hover:bg-muted flex h-[42px] items-center gap-2.5 rounded-[6px] px-2.5 text-[12.5px] font-medium transition-colors"
              >
                <Icon
                  className="text-muted-foreground size-[15px] shrink-0"
                  aria-hidden
                />
                <span className="min-w-0 flex-1 truncate leading-[17px]">
                  {account.name}
                </span>
                <span className="text-muted-foreground text-[11.5px] leading-[16px] font-normal tabular-nums">
                  {formatCurrency(
                    account.currentBalance,
                    account.currency,
                    undefined,
                    {
                      showCents: false,
                    },
                  )}
                </span>
              </Link>
            );
          })
        )}
      </div>

      {groups.length > 0 ? (
        <>
          <div className="border-line2 border-t" />
          {groups.length > 1 ? (
            groups.map((group) => (
              <div
                key={group.currency}
                className="flex h-10 items-center justify-between px-2.5"
              >
                <span className="text-muted-foreground text-[11.5px] leading-[16px]">
                  Total {group.currency}
                </span>
                <span className="font-heading text-ink text-[12.5px] leading-[16px] font-semibold tabular-nums">
                  {formatCurrency(group.total, group.currency, undefined, {
                    showCents: false,
                  })}
                </span>
              </div>
            ))
          ) : (
            <div className="flex h-10 items-center justify-between px-2.5">
              <span className="text-muted-foreground text-[11.5px] leading-[16px]">
                Total
              </span>
              <span className="font-heading text-ink text-[12.5px] leading-[16px] font-semibold tabular-nums">
                {formatCurrency(
                  groups[0].total,
                  groups[0].currency,
                  undefined,
                  {
                    showCents: false,
                  },
                )}
              </span>
            </div>
          )}
        </>
      ) : null}

      <AccountCreation creation={creation} />
    </section>
  );
};
