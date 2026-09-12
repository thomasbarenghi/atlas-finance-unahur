import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { assetEndpoints } from "@/lib/api/endpoints";
import type {
  CreateAssetInput,
  CreateValuationInput,
  UpdateAssetInput,
} from "@/lib/api/types";
import { queryKeys } from "./keys";

const invalidateAssetViews = (
  queryClient: ReturnType<typeof useQueryClient>,
) => {
  queryClient.invalidateQueries({ queryKey: queryKeys.assets });
  queryClient.invalidateQueries({ queryKey: queryKeys.dashboardBase });
};

export const useAssets = () =>
  useQuery({
    queryKey: queryKeys.assets,
    queryFn: assetEndpoints.list,
  });

export const useCreateAsset = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: CreateAssetInput) => assetEndpoints.create(input),
    onSuccess: () => invalidateAssetViews(queryClient),
  });
};

export const useUpdateAsset = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, input }: { id: string; input: UpdateAssetInput }) =>
      assetEndpoints.update(id, input),
    onSuccess: () => invalidateAssetViews(queryClient),
  });
};

export const useArchiveAsset = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => assetEndpoints.archive(id),
    onSuccess: () => invalidateAssetViews(queryClient),
  });
};

export const useValuations = (assetId: string) =>
  useQuery({
    queryKey: queryKeys.valuations(assetId),
    queryFn: () => assetEndpoints.valuations(assetId),
    enabled: Boolean(assetId),
  });

export const useCreateValuation = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      assetId,
      input,
    }: {
      assetId: string;
      input: CreateValuationInput;
    }) => assetEndpoints.createValuation(assetId, input),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({
        queryKey: queryKeys.valuations(variables.assetId),
      });
      invalidateAssetViews(queryClient);
    },
  });
};
