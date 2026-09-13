import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { debtEndpoints } from "@/lib/api/endpoints";
import type { CreateDebtInput, UpdateDebtInput } from "@/lib/api/types";
import { queryKeys } from "./keys";

const invalidateDebtViews = (
  queryClient: ReturnType<typeof useQueryClient>,
) => {
  queryClient.invalidateQueries({ queryKey: queryKeys.debts });
  queryClient.invalidateQueries({ queryKey: queryKeys.assets });
  queryClient.invalidateQueries({ queryKey: queryKeys.dashboardBase });
};

export const useDebts = () =>
  useQuery({
    queryKey: queryKeys.debts,
    queryFn: debtEndpoints.list,
  });

export const useCreateDebt = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: CreateDebtInput) => debtEndpoints.create(input),
    onSuccess: () => invalidateDebtViews(queryClient),
  });
};

export const useUpdateDebt = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, input }: { id: string; input: UpdateDebtInput }) =>
      debtEndpoints.update(id, input),
    onSuccess: () => invalidateDebtViews(queryClient),
  });
};

export const useArchiveDebt = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => debtEndpoints.archive(id),
    onSuccess: () => invalidateDebtViews(queryClient),
  });
};
