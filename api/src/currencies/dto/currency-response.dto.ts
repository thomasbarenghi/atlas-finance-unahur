import type { CurrencyCatalogEntry } from "../currency-catalog";

export interface CurrencyRateDto {
  currency: string;
  name: string;
  symbol: string;
  /** How many units of the user's primary currency one unit buys. */
  rate: number;
  rateDate: string;
  source: "api";
}

export interface CurrencySettingsDto {
  primaryCurrency: string;
  rates: CurrencyRateDto[];
  updatedAt: string | null;
}

export type CurrencyCatalogDto = CurrencyCatalogEntry;
