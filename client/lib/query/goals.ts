import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { goalEndpoints } from "@/lib/api/endpoints";
import type { CreateGoalInput, UpdateGoalInput } from "@/lib/api/types";
import { queryKeys } from "./keys";

const invalidateGoalViews = (
  queryClient: ReturnType<typeof useQueryClient>,
) => {
  queryClient.invalidateQueries({ queryKey: queryKeys.goals });
  queryClient.invalidateQueries({ queryKey: queryKeys.dashboardBase });
};

export const useGoals = () =>
  useQuery({
    queryKey: queryKeys.goals,
    queryFn: goalEndpoints.list,
  });

export const useCreateGoal = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: CreateGoalInput) => goalEndpoints.create(input),
    onSuccess: () => invalidateGoalViews(queryClient),
  });
};

export const useUpdateGoal = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, input }: { id: string; input: UpdateGoalInput }) =>
      goalEndpoints.update(id, input),
    onSuccess: () => invalidateGoalViews(queryClient),
  });
};

export const useArchiveGoal = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => goalEndpoints.archive(id),
    onSuccess: () => invalidateGoalViews(queryClient),
  });
};

export const useRestoreGoal = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => goalEndpoints.restore(id),
    onSuccess: () => invalidateGoalViews(queryClient),
  });
};
