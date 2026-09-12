"use client";

import { useMemo } from "react";
import { useQueryParam } from "@/hooks/use-query-param";
import { useAccounts } from "@/lib/query/accounts";

export const useGoalDetail = () => {
  const goalId = useQueryParam("id") ?? undefined;
  const accountsQuery = useAccounts();

  const accounts = useMemo(
    () => accountsQuery.data ?? [],
    [accountsQuery.data],
  );
  const goal = useMemo(
    () => accounts.find((item) => item.id === goalId && item.type === "goal"),
    [accounts, goalId],
  );
  const sourceAccount = useMemo(
    () =>
      goal?.sourceAccountId
        ? accounts.find((item) => item.id === goal.sourceAccountId)
        : undefined,
    [accounts, goal],
  );

  return {
    goal,
    sourceAccount,
    isLoading: accountsQuery.isLoading,
  };
};
