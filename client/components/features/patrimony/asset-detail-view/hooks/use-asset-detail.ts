"use client";

import { useMemo } from "react";
import { useQueryParam } from "@/hooks/use-query-param";
import { linkedDebtForAsset } from "@/lib/patrimony";
import { useAssets, useValuations } from "@/lib/query/assets";
import { useDebts } from "@/lib/query/debts";

export const useAssetDetail = () => {
  const assetId = useQueryParam("id") ?? undefined;

  const assetsQuery = useAssets();
  const debtsQuery = useDebts();
  const valuationsQuery = useValuations(assetId ?? "");

  const asset = useMemo(
    () => (assetsQuery.data ?? []).find((item) => item.id === assetId),
    [assetsQuery.data, assetId],
  );

  const linkedDebt = useMemo(
    () =>
      asset ? linkedDebtForAsset(debtsQuery.data ?? [], asset) : undefined,
    [asset, debtsQuery.data],
  );

  return {
    asset,
    valuations: valuationsQuery.data ?? [],
    linkedDebt,
    isLoading: assetsQuery.isLoading || valuationsQuery.isLoading,
  };
};
