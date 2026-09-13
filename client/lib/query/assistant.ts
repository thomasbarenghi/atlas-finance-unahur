import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { assistantEndpoints } from "@/lib/api/endpoints";
import { queryKeys } from "./keys";

export const useConversations = () =>
  useQuery({
    queryKey: queryKeys.conversations,
    queryFn: assistantEndpoints.conversations,
  });

export const useClearConversations = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: assistantEndpoints.clearConversations,
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: queryKeys.conversations }),
  });
};
