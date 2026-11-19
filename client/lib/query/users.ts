import { useMutation, useQueryClient } from "@tanstack/react-query";
import { userEndpoints } from "@/lib/api/endpoints";
import type { ChangePasswordInput, UpdateUserInput } from "@/lib/api/types";
import { queryKeys } from "./keys";

export const useUpdateMe = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: UpdateUserInput) => userEndpoints.updateMe(input),
    onSuccess: (user) => {
      queryClient.setQueryData(queryKeys.auth.me, user);
      queryClient.invalidateQueries({ queryKey: queryKeys.currencyRates });
      queryClient.invalidateQueries({ queryKey: queryKeys.dashboardBase });
      queryClient.invalidateQueries({ queryKey: queryKeys.accounts });
    },
  });
};

export const useChangePassword = () =>
  useMutation({
    mutationFn: (input: ChangePasswordInput) =>
      userEndpoints.changePassword(input),
  });
