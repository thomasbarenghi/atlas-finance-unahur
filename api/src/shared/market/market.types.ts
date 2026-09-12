export interface ProviderQuote {
  symbol: string;
  price: number;
  currency: string;
  provider: string;
  change24h: number | null;
}

export interface ProviderRate {
  baseCurrency: string;
  quoteCurrency: string;
  rate: number;
  provider: string;
  date?: string;
}

export interface MarketRefreshOutcome {
  updated: number;
  error: string | null;
}

export interface MarketRefreshResult {
  refreshedAt: string;
  crypto: MarketRefreshOutcome;
  fx: MarketRefreshOutcome;
}
