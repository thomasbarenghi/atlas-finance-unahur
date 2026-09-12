import { useQuery } from "@tanstack/react-query";
import { quoteEndpoints } from "@/lib/api/endpoints";
import { queryKeys } from "./keys";

export const useQuotes = () =>
  useQuery({
    queryKey: queryKeys.quotes,
    queryFn: quoteEndpoints.list,
    staleTime: 60_000,
  });
