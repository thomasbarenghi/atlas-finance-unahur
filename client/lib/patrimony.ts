import type { Asset, Debt, Valuation } from "@/lib/api/types";

export interface ValuationChange {
  current: number;
  previous: number | null;
  delta: number;
  deltaPct: number | null;
  date: string;
  currency: string;
}

export const sortValuations = (valuations: Valuation[]): Valuation[] =>
  [...valuations].sort((first, second) =>
    first.date.localeCompare(second.date),
  );

export const valuationChange = (
  valuations: Valuation[],
): ValuationChange | null => {
  if (valuations.length === 0) return null;

  const ordered = sortValuations(valuations);
  const latest = ordered[ordered.length - 1];
  const previous = ordered.length > 1 ? ordered[ordered.length - 2] : null;
  const delta = previous ? latest.value - previous.value : 0;

  return {
    current: latest.value,
    previous: previous?.value ?? null,
    delta,
    deltaPct:
      previous && previous.value !== 0
        ? (delta / Math.abs(previous.value)) * 100
        : null,
    date: latest.date,
    currency: latest.currency,
  };
};

export const linkedDebtForAsset = (
  debts: Debt[],
  asset: Asset,
): Debt | undefined =>
  debts.find((debt) => debt.assetId === asset.id || debt.id === asset.debtId);

export const linkedAssetForDebt = (
  assets: Asset[],
  debt: Debt,
): Asset | undefined =>
  debt.assetId ? assets.find((asset) => asset.id === debt.assetId) : undefined;

export const equityFor = (assetValue: number, debtBalance: number): number =>
  assetValue - debtBalance;
