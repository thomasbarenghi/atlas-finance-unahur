import { useMutation, useQueryClient } from "@tanstack/react-query";
import { userEndpoints } from "@/lib/api/endpoints";
import type { UpdateUserInput } from "@/lib/api/types";
import { queryKeys } from "./keys";

export const useUpdateMe = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: UpdateUserInput) => userEndpoints.updateMe(input),
    onSuccess: (user) => {
      queryClient.setQueryData(queryKeys.auth.me, user);
      queryClient.invalidateQueries({ queryKey: queryKeys.dashboardBase });
    },
  });
};
