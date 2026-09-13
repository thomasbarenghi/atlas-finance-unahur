"use client";

import { useMemo } from "react";
import { usePeriod } from "@/hooks/use-period";
import { useQueryParam } from "@/hooks/use-query-param";
import { useAccounts } from "@/lib/query/accounts";
import { useTransactions } from "@/lib/query/transactions";

const PERIOD_PAGE_SIZE = 100;

export const useAccountDetail = () => {
  const accountId = useQueryParam("id") ?? undefined;
  const { range } = usePeriod();

  const accountsQuery = useAccounts();
  const accounts = useMemo(
    () => accountsQuery.data ?? [],
    [accountsQuery.data],
  );
  const account = useMemo(
    () => accounts.find((item) => item.id === accountId),
    [accounts, accountId],
  );

  const transactionsQuery = useTransactions({
    accountId,
    from: range.from,
    to: range.to,
    pageSize: PERIOD_PAGE_SIZE,
  });

  const summary = useMemo(() => {
    const items = transactionsQuery.data?.items ?? [];
    return items.reduce(
      (totals, transaction) => {
        if (transaction.type === "income") totals.income += transaction.amount;
        if (transaction.type === "expense") {
          totals.expense += transaction.amount;
        }
        return totals;
      },
      { income: 0, expense: 0 },
    );
  }, [transactionsQuery.data]);

  return {
    account,
    accounts,
    isLoading: accountsQuery.isLoading,
    transactions: transactionsQuery.data?.items ?? [],
    isLoadingTransactions: transactionsQuery.isLoading,
    movementCount: transactionsQuery.data?.total ?? 0,
    summary,
    range,
  };
};
