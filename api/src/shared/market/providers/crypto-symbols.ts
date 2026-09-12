const CRYPTO_SYMBOLS = new Set([
  "BTC",
  "ETH",
  "USDT",
  "USDC",
  "SOL",
  "BNB",
  "XRP",
  "ADA",
  "DOGE",
  "DOT",
  "LTC",
  "AVAX",
  "LINK",
  "TRX",
  "ATOM",
  "XLM",
  "ALGO",
  "UNI",
  "BCH",
  "MATIC",
]);

export const isSupportedCryptoSymbol = (symbol: string): boolean =>
  CRYPTO_SYMBOLS.has(symbol.toUpperCase());

export const binancePairFor = (symbol: string, quoteAsset: string): string =>
  `${symbol.toUpperCase()}${quoteAsset.toUpperCase()}`;
