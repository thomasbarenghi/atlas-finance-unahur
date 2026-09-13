"use client";

import { useMemo } from "react";
import { useQueryParam } from "@/hooks/use-query-param";
import { useAccounts } from "@/lib/query/accounts";
import { useGoals } from "@/lib/query/goals";

export const useGoalDetail = () => {
  const goalId = useQueryParam("id") ?? undefined;
  const goalsQuery = useGoals();
  const accountsQuery = useAccounts();

  const goals = useMemo(() => goalsQuery.data ?? [], [goalsQuery.data]);
  const accounts = useMemo(
    () => accountsQuery.data ?? [],
    [accountsQuery.data],
  );
  const goal = useMemo(
    () => goals.find((item) => item.id === goalId),
    [goals, goalId],
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
    isLoading: goalsQuery.isLoading || accountsQuery.isLoading,
  };
};
