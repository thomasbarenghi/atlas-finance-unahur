import { useQuery } from "@tanstack/react-query";
import { categoryEndpoints } from "@/lib/api/endpoints";
import { queryKeys } from "./keys";

export const useCategories = () =>
  useQuery({
    queryKey: queryKeys.categories,
    queryFn: categoryEndpoints.list,
  });
