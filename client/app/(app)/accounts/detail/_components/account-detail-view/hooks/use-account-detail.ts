"use client";

import { useMemo } from "react";
import { useQueryParam } from "@/hooks/use-query-param";
import { useAccounts } from "@/lib/query/accounts";
import { useTransactions } from "@/lib/query/transactions";

const ACCOUNT_PAGE_SIZE = 100;

export const useAccountDetail = () => {
  const accountId = useQueryParam("id") ?? undefined;

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
    page: 1,
    pageSize: ACCOUNT_PAGE_SIZE,
  });

  const transactions = useMemo(
    () =>
      (transactionsQuery.data?.items ?? []).filter(
        (transaction) => transaction.accountId === accountId,
      ),
    [transactionsQuery.data, accountId],
  );

  const summary = useMemo(
    () =>
      transactions.reduce(
        (totals, transaction) => {
          if (transaction.type === "income") {
            totals.income += transaction.amount;
          }
          if (transaction.type === "expense") {
            totals.expense += transaction.amount;
          }
          return totals;
        },
        { income: 0, expense: 0 },
      ),
    [transactions],
  );

  return {
    account,
    accounts,
    isLoading: accountsQuery.isLoading,
    transactions,
    isLoadingTransactions: transactionsQuery.isLoading,
    movementCount: transactions.length,
    summary,
  };
};
