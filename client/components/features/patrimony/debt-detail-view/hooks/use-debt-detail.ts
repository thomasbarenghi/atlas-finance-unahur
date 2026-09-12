"use client";

import { useMemo } from "react";
import { useQueryParam } from "@/hooks/use-query-param";
import { linkedAssetForDebt } from "@/lib/patrimony";
import { useAssets } from "@/lib/query/assets";
import { useDebts } from "@/lib/query/debts";

export const useDebtDetail = () => {
  const debtId = useQueryParam("id") ?? undefined;

  const debtsQuery = useDebts();
  const assetsQuery = useAssets();

  const assets = useMemo(() => assetsQuery.data ?? [], [assetsQuery.data]);
  const debt = useMemo(
    () => (debtsQuery.data ?? []).find((item) => item.id === debtId),
    [debtsQuery.data, debtId],
  );
  const linkedAsset = useMemo(
    () => (debt ? linkedAssetForDebt(assets, debt) : undefined),
    [debt, assets],
  );

  return {
    debt,
    linkedAsset,
    assets,
    isLoading: debtsQuery.isLoading || assetsQuery.isLoading,
  };
};
