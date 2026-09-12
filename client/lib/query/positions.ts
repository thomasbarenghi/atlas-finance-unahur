import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { positionEndpoints } from "@/lib/api/endpoints";
import type { CreatePositionInput, UpdatePositionInput } from "@/lib/api/types";
import { queryKeys } from "./keys";

const invalidatePositionViews = (
  queryClient: ReturnType<typeof useQueryClient>,
) => {
  queryClient.invalidateQueries({ queryKey: queryKeys.positions });
  queryClient.invalidateQueries({ queryKey: queryKeys.dashboardBase });
};

export const usePositions = () =>
  useQuery({
    queryKey: queryKeys.positions,
    queryFn: positionEndpoints.list,
  });

export const useCreatePosition = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: CreatePositionInput) => positionEndpoints.create(input),
    onSuccess: () => invalidatePositionViews(queryClient),
  });
};

export const useUpdatePosition = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, input }: { id: string; input: UpdatePositionInput }) =>
      positionEndpoints.update(id, input),
    onSuccess: () => invalidatePositionViews(queryClient),
  });
};

export const useDeletePosition = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => positionEndpoints.remove(id),
    onSuccess: () => invalidatePositionViews(queryClient),
  });
};
