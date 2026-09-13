import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { budgetEndpoints } from "@/lib/api/endpoints";
import type {
  CopyBudgetsInput,
  CreateBudgetInput,
  UpdateBudgetInput,
} from "@/lib/api/types";
import { queryKeys } from "./keys";

const invalidateBudgetViews = (
  queryClient: ReturnType<typeof useQueryClient>,
) => {
  queryClient.invalidateQueries({ queryKey: queryKeys.budgetsBase });
  queryClient.invalidateQueries({ queryKey: queryKeys.dashboardBase });
};

export const useBudgets = (period?: string) =>
  useQuery({
    queryKey: queryKeys.budgets(period),
    queryFn: () => budgetEndpoints.list(period),
  });

export const useCreateBudget = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: CreateBudgetInput) => budgetEndpoints.create(input),
    onSuccess: () => invalidateBudgetViews(queryClient),
  });
};

export const useUpdateBudget = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, input }: { id: string; input: UpdateBudgetInput }) =>
      budgetEndpoints.update(id, input),
    onSuccess: () => invalidateBudgetViews(queryClient),
  });
};

export const useDeleteBudget = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => budgetEndpoints.remove(id),
    onSuccess: () => invalidateBudgetViews(queryClient),
  });
};

export const useCopyPreviousBudgets = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: CopyBudgetsInput) =>
      budgetEndpoints.copyPrevious(input),
    onSuccess: () => invalidateBudgetViews(queryClient),
  });
};
