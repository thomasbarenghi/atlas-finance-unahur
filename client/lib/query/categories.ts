import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { categoryEndpoints } from "@/lib/api/endpoints";
import type { CreateCategoryInput, UpdateCategoryInput } from "@/lib/api/types";
import { queryKeys } from "./keys";

const invalidateCategoryViews = (
  queryClient: ReturnType<typeof useQueryClient>,
) => {
  queryClient.invalidateQueries({ queryKey: queryKeys.categories });
  queryClient.invalidateQueries({ queryKey: queryKeys.transactionsBase });
  queryClient.invalidateQueries({ queryKey: queryKeys.dashboardBase });
};

export const useCategories = () =>
  useQuery({
    queryKey: queryKeys.categories,
    queryFn: categoryEndpoints.list,
  });

export const useCreateCategory = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: CreateCategoryInput) => categoryEndpoints.create(input),
    onSuccess: () => invalidateCategoryViews(queryClient),
  });
};

export const useUpdateCategory = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, input }: { id: string; input: UpdateCategoryInput }) =>
      categoryEndpoints.update(id, input),
    onSuccess: () => invalidateCategoryViews(queryClient),
  });
};

export const useDeleteCategory = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => categoryEndpoints.remove(id),
    onSuccess: () => invalidateCategoryViews(queryClient),
  });
};
