"use client";

import { useQuery } from "@tanstack/react-query";
import { currencyEndpoints } from "@/lib/api/endpoints";
import { queryKeys } from "./keys";

export const useCurrencies = () =>
  useQuery({
    queryKey: queryKeys.currencies,
    queryFn: currencyEndpoints.catalog,
    staleTime: 60 * 60 * 1000,
  });

export const useCurrencyRates = () =>
  useQuery({
    queryKey: queryKeys.currencyRates,
    queryFn: currencyEndpoints.settings,
  });
