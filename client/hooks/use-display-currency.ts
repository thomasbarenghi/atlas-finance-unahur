"use client";

import { CURRENCY } from "@/lib/currency";

export interface DisplayCurrencyContextValue {
  currency: string;
}

/**
 * Single system currency (v0.3). Kept as a hook so consumers stay unchanged
 * without a provider or selector.
 */
export const useDisplayCurrency = (): DisplayCurrencyContextValue => ({
  currency: CURRENCY,
});
