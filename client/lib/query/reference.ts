import { useQuery } from "@tanstack/react-query";
import { referenceEndpoints } from "@/lib/api/endpoints";
import { queryKeys } from "./keys";

export const useCurrencies = () =>
  useQuery({
    queryKey: queryKeys.currencies,
    queryFn: referenceEndpoints.currencies,
    staleTime: 60 * 60_000,
  });
