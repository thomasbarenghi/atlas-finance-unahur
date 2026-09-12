"use client";

import { useMemo } from "react";
import { useDisplayCurrency } from "@/hooks/use-display-currency";
import { usePeriod } from "@/hooks/use-period";
import { useQueryParam } from "@/hooks/use-query-param";
import { useDashboard } from "@/lib/query/dashboard";
import { usePositions } from "@/lib/query/positions";

export const usePositionDetail = () => {
  const positionId = useQueryParam("id");
  const symbol = useQueryParam("symbol");
  const currencyParam = useQueryParam("currency");
  const { range } = usePeriod();
  const { currency } = useDisplayCurrency();

  const positionsQuery = usePositions();
  const dashboardQuery = useDashboard({
    from: range.from,
    to: range.to,
    currency,
  });

  const position = useMemo(() => {
    const list = positionsQuery.data ?? [];
    if (positionId) return list.find((item) => item.id === positionId);
    if (symbol) {
      return list.find(
        (item) =>
          item.symbol === symbol &&
          (!currencyParam || item.currency === currencyParam),
      );
    }
    return undefined;
  }, [positionsQuery.data, positionId, symbol, currencyParam]);

  const convertedValue = useMemo(() => {
    if (!position) return null;
    const match = dashboardQuery.data?.investments.positions.find(
      (item) =>
        item.symbol === position.symbol &&
        item.originalCurrency === position.currency,
    );
    return match?.value ?? null;
  }, [position, dashboardQuery.data]);

  return {
    position,
    convertedValue,
    displayCurrency: currency,
    isLoading: positionsQuery.isLoading,
  };
};
