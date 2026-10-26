"use client";

import { useMemo, type ReactNode } from "react";
import { ArrowLeftRight } from "lucide-react";
import { EmptyState } from "@/components/common/empty-state";
import { ListPagination } from "@/components/common/list-pagination";
import { ListSkeleton } from "@/components/common/list-skeleton";
import { useMediaQuery } from "@/hooks/use-media-query";
import type { Transaction } from "@/lib/api/types";
import { cn } from "@/lib/utils";
import type { ListPaginationProps } from "@/components/common/list-pagination";
import { TransactionRow } from "./components/transaction-row";
import { collapseTransfers } from "./transaction-list.utils";
import { groupTransactionsByMonth } from "./group-transactions";

export interface TransactionListProps {
  transactions: Transaction[];
  accountNameById: Map<string, string>;
  contextAccountId?: string;
  categoryNameById: Map<string, string>;
  isLoading?: boolean;
  pagination?: ListPaginationProps;
  groupByMonth?: boolean;
  compact?: boolean;
  header?: ReactNode;
  onSelect?: (transaction: Transaction) => void;
  onDelete?: (transaction: Transaction) => void;
  emptyAction?: ReactNode;
}

export const TransactionList = ({
  transactions,
  accountNameById,
  contextAccountId,
  categoryNameById,
  isLoading,
  pagination,
  groupByMonth = false,
  compact = false,
  header,
  onSelect,
  onDelete,
  emptyAction,
}: TransactionListProps) => {
  const isDesktop = useMediaQuery("(min-width: 768px)");
  const rows = useMemo(() => collapseTransfers(transactions), [transactions]);
  const groups = useMemo(() => groupTransactionsByMonth(rows), [rows]);

  if (!isLoading && rows.length === 0) {
    return (
      <EmptyState
        icon={ArrowLeftRight}
        title="Sin movimientos"
        description="No hay ingresos, gastos ni transferencias en este período."
        action={emptyAction}
      />
    );
  }

  const renderRow = (transaction: Transaction) => (
    <TransactionRow
      transaction={transaction}
      accountNameById={accountNameById}
      categoryNameById={categoryNameById}
      contextAccountId={contextAccountId}
      compact={compact}
      showCents={isDesktop}
      onSelect={onSelect}
      onDelete={onDelete}
    />
  );

  return (
    <div className="flex flex-col gap-3">
      <div className="surface-list rounded-[20px] md:rounded-[22px]">
        {header ? (
          <div className="border-line2 border-b px-3.5 py-3 md:px-[18px] md:py-[14px]">
            {header}
          </div>
        ) : null}
        {isLoading ? (
          <ListSkeleton rows={6} />
        ) : groupByMonth ? (
          groups.map((group) => (
            <section key={group.key}>
              <header className="bg-[#F9FAFB] dark:bg-muted/40 flex h-[30px] items-center px-3.5 md:h-9 md:px-[18px]">
                <h3 className="text-muted-foreground font-sans text-[10px] leading-[14px] font-bold tracking-[0.12em] uppercase">
                  {group.label}
                </h3>
              </header>
              <ul>
                {group.items.map((transaction, index) => (
                  <li
                    key={transaction.id}
                    className={cn(index > 0 && "border-line2 border-t")}
                  >
                    {renderRow(transaction)}
                  </li>
                ))}
              </ul>
            </section>
          ))
        ) : (
          <ul>
            {rows.map((transaction, index) => (
              <li
                key={transaction.id}
                className={cn(index > 0 && "border-line2 border-t")}
              >
                {renderRow(transaction)}
              </li>
            ))}
          </ul>
        )}
      </div>

      {pagination ? <ListPagination {...pagination} /> : null}
    </div>
  );
};
