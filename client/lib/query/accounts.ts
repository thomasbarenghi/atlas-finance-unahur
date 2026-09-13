import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { accountEndpoints } from "@/lib/api/endpoints";
import type { CreateAccountInput, UpdateAccountInput } from "@/lib/api/types";
import { queryKeys } from "./keys";

const invalidateAccountViews = (
  queryClient: ReturnType<typeof useQueryClient>,
) => {
  queryClient.invalidateQueries({ queryKey: queryKeys.accounts });
  queryClient.invalidateQueries({ queryKey: queryKeys.transactionsBase });
  queryClient.invalidateQueries({ queryKey: queryKeys.dashboardBase });
};

export const useAccounts = () =>
  useQuery({
    queryKey: queryKeys.accounts,
    queryFn: accountEndpoints.list,
  });

export const useCreateAccount = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: CreateAccountInput) => accountEndpoints.create(input),
    onSuccess: () => invalidateAccountViews(queryClient),
  });
};

export const useUpdateAccount = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, input }: { id: string; input: UpdateAccountInput }) =>
      accountEndpoints.update(id, input),
    onSuccess: () => invalidateAccountViews(queryClient),
  });
};

export const useArchiveAccount = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => accountEndpoints.archive(id),
    onSuccess: () => invalidateAccountViews(queryClient),
  });
};

export const useRestoreAccount = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => accountEndpoints.restore(id),
    onSuccess: () => invalidateAccountViews(queryClient),
  });
};
