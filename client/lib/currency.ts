import type {
  Account,
  CurrencyCatalogItem,
  CurrencyRate,
  DashboardRate,
} from "@/lib/api/types";

/** Rate in the primary currency for a given code (primary = 1). */
export const rateInPrimary = (
  currency: string,
  rates: Array<Pick<CurrencyRate, "currency" | "rate"> | DashboardRate>,
  primaryCurrency: string,
): number => {
  if (currency === primaryCurrency) return 1;
  return rates.find((rate) => rate.currency === currency)?.rate ?? 1;
};

export const convertAmount = (
  value: number,
  from: string,
  to: string,
  rates: Array<Pick<CurrencyRate, "currency" | "rate"> | DashboardRate>,
  primaryCurrency: string,
): number => {
  if (from === to) return value;
  const fromRate = rateInPrimary(from, rates, primaryCurrency);
  const toRate = rateInPrimary(to, rates, primaryCurrency);
  if (!fromRate || !toRate) return value;
  return (value * fromRate) / toRate;
};

const RATE_FORMATTER = new Intl.NumberFormat("es-AR", {
  maximumFractionDigits: 6,
});

const RATE_FORMATTER_TWO_DECIMALS = new Intl.NumberFormat("es-AR", {
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

/** Two decimals for normal quotes, more precision only for very small ones. */
export const formatRateValue = (value: number): string =>
  value >= 1
    ? RATE_FORMATTER_TWO_DECIMALS.format(value)
    : RATE_FORMATTER.format(value);

export const formatRateLine = (
  currency: string,
  primaryCurrency: string,
  rate: number,
): string => `1 ${currency} = ${formatRateValue(rate)} ${primaryCurrency}`;

export interface CurrencyGroup {
  currency: string;
  accounts: Account[];
  total: number;
}

/** Groups accounts by currency, primary first and then by code. */
export const groupAccountsByCurrency = (
  accounts: Account[],
  primaryCurrency: string,
): CurrencyGroup[] => {
  const groups = new Map<string, Account[]>();
  for (const account of accounts) {
    const bucket = groups.get(account.currency) ?? [];
    bucket.push(account);
    groups.set(account.currency, bucket);
  }
  return [...groups.entries()]
    .map(([currency, items]) => ({
      currency,
      accounts: items,
      total: items.reduce((sum, account) => sum + account.currentBalance, 0),
    }))
    .sort((first, second) => {
      if (first.currency === primaryCurrency) return -1;
      if (second.currency === primaryCurrency) return 1;
      return first.currency.localeCompare(second.currency);
    });
};

const GROUP_LABELS: Record<string, string> = {
  ARS: "Pesos",
  USD: "Dólares",
  EUR: "Euros",
  GBP: "Libras",
  INR: "Rupias",
  JPY: "Yenes",
  MXN: "Pesos mexicanos",
  UYU: "Pesos uruguayos",
  BRL: "Reales",
  CLP: "Pesos chilenos",
  COP: "Pesos colombianos",
  PEN: "Soles",
};

export const currencyGroupLabel = (currency: string): string =>
  GROUP_LABELS[currency] ?? currency;

export const currencyName = (
  currency: string,
  catalog: CurrencyCatalogItem[] | undefined,
): string => catalog?.find((item) => item.code === currency)?.name ?? currency;

export const currencySymbol = (
  currency: string,
  catalog: CurrencyCatalogItem[] | undefined,
): string =>
  catalog?.find((item) => item.code === currency)?.symbol ?? currency;

/** Symbol from Intl, for components that do not have the catalog loaded. */
export const formatCurrencySymbol = (currency: string): string => {
  try {
    return (
      new Intl.NumberFormat("es-AR", {
        style: "currency",
        currency,
      })
        .formatToParts(0)
        .find((part) => part.type === "currency")?.value ?? currency
    );
  } catch {
    return currency;
  }
};

export const sortCurrencyCodes = (
  codes: string[],
  primaryCurrency: string,
): string[] =>
  [...new Set(codes)].sort((first, second) => {
    if (first === primaryCurrency) return -1;
    if (second === primaryCurrency) return 1;
    return first.localeCompare(second);
  });
