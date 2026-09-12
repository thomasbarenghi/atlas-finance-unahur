"use client";

import Link from "next/link";
import { Wallet } from "lucide-react";
import { Amount } from "@/components/common/amount";
import { DataList } from "@/components/common/data-list";
import { DataListItem } from "@/components/common/data-list-item";
import { EmptyState } from "@/components/common/empty-state";
import { StatusBadge } from "@/components/common/status-badge";
import { Progress } from "@/components/ui/progress";
import { AccountIcon } from "@/components/features/accounts/account-icon";
import { formatCurrency, formatMonth, formatPercentPoints } from "@/lib/format";
import { goalAccountProgress } from "@/lib/goal-account";
import {
  ACCOUNT_TYPE_LABELS,
  ACCOUNT_TYPE_VALUES as TYPE_ORDER,
} from "@/lib/labels";
import type { AccountsListProps } from "./accounts-list.types";

export const AccountsList = ({
  accounts,
  sourceNameById,
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
      renderItem={(account) => {
        if (account.type === "goal") {
          const {
            saved,
            target,
            remaining,
            progressPct,
            status,
            targetDate,
            monthlySaving,
          } = goalAccountProgress(account);
          const source = account.sourceAccountId
            ? sourceNameById?.get(account.sourceAccountId)
            : undefined;

          return (
            <Link
              href={`/goals/detail?id=${account.id}`}
              className="flex w-full flex-col gap-3 px-4 py-3 transition-colors hover:bg-muted/40 active:bg-muted/60"
            >
              <div className="flex items-center gap-3">
                <AccountIcon type="goal" />
                <div className="min-w-0 flex-1">
                  <div className="truncate text-sm font-medium">
                    {account.name}
                  </div>
                  <div className="text-muted-foreground mt-0.5 truncate text-xs">
                    {formatCurrency(saved, account.currency)} de{" "}
                    {formatCurrency(target, account.currency)}
                    {source ? ` · ${source}` : ""}
                  </div>
                </div>
                <StatusBadge variant="goal" status={status} />
              </div>
              <Progress value={progressPct} className="h-2" />
              <div className="text-muted-foreground flex items-center justify-between text-xs tabular-nums">
                <span>{formatPercentPoints(progressPct)}</span>
                <span>
                  {saved < target
                    ? `Faltan ${formatCurrency(remaining, account.currency)}`
                    : "Meta cumplida"}
                </span>
              </div>
              {targetDate || monthlySaving !== null ? (
                <div className="text-muted-foreground flex flex-wrap items-center justify-between gap-x-3 text-xs">
                  {targetDate ? (
                    <span>Objetivo: {formatMonth(targetDate)}</span>
                  ) : null}
                  {monthlySaving !== null ? (
                    <span className="tabular-nums">
                      Necesitás ahorrar{" "}
                      {formatCurrency(monthlySaving, account.currency)}/mes
                    </span>
                  ) : null}
                </div>
              ) : null}
            </Link>
          );
        }

        return (
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
                  <span className="text-destructive text-xs">
                    Saldo negativo
                  </span>
                ) : null}
              </span>
            }
          />
        );
      }}
    />
  );
};
