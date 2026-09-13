import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { categoryEndpoints } from "@/lib/api/endpoints";
import type { CreateCategoryInput, UpdateCategoryInput } from "@/lib/api/types";
import { queryKeys } from "./keys";

export const useCategories = () =>
  useQuery({
    queryKey: queryKeys.categories,
    queryFn: categoryEndpoints.list,
  });

export const useCreateCategory = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: CreateCategoryInput) => categoryEndpoints.create(input),
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: queryKeys.categories }),
  });
};

export const useUpdateCategory = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, input }: { id: string; input: UpdateCategoryInput }) =>
      categoryEndpoints.update(id, input),
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: queryKeys.categories }),
  });
};

export const useArchiveCategory = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => categoryEndpoints.archive(id),
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: queryKeys.categories }),
  });
};
