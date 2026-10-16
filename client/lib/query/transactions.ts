import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { transactionEndpoints } from "@/lib/api/endpoints";
import type {
  CreateTransactionInput,
  TransactionListQuery,
  UpdateTransactionInput,
} from "@/lib/api/types";
import { queryKeys } from "./keys";

export const useTransactions = (
  params: TransactionListQuery,
  options?: { enabled?: boolean },
) =>
  useQuery({
    queryKey: queryKeys.transactions(params),
    queryFn: () => transactionEndpoints.list(params),
    placeholderData: (previous) => previous,
    enabled: options?.enabled ?? true,
  });

const invalidateTransactionViews = (
  queryClient: ReturnType<typeof useQueryClient>,
) => {
  queryClient.invalidateQueries({ queryKey: queryKeys.transactionsBase });
  queryClient.invalidateQueries({ queryKey: queryKeys.accounts });
  queryClient.invalidateQueries({ queryKey: queryKeys.dashboardBase });
};

export const useCreateTransaction = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: CreateTransactionInput) =>
      transactionEndpoints.create(input),
    onSuccess: () => invalidateTransactionViews(queryClient),
  });
};

export const useUpdateTransaction = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      id,
      input,
    }: {
      id: string;
      input: UpdateTransactionInput;
    }) => transactionEndpoints.update(id, input),
    onSuccess: () => invalidateTransactionViews(queryClient),
  });
};

export const useDeleteTransaction = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => transactionEndpoints.remove(id),
    onSuccess: () => invalidateTransactionViews(queryClient),
  });
};
