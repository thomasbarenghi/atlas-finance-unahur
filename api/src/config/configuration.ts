export interface DatabaseConfig {
  url: string;
  ssl: boolean;
}

export interface JwtConfig {
  accessSecret: string;
  refreshSecret: string;
  accessTtl: number;
  refreshTtlDays: number;
}

export interface CookieConfig {
  secure: boolean;
  sameSite: "lax" | "strict" | "none";
}

export interface CorsConfig {
  origin: string;
  native: string[];
}

export interface MarketConfig {
  enabled: boolean;
  cryptoUrl: string;
  fxUrl: string;
  vsCurrency: string;
  timeoutMs: number;
  refreshIntervalMs: number;
  symbols: string[];
  quoteStaleMs: number;
}

export interface AiConfig {
  provider: string;
  apiKey: string | null;
  baseUrl: string;
  model: string;
  timeoutMs: number;
  devUserEmail: string;
  actionTtlMs: number;
}

export interface MailConfig {
  host: string | null;
  port: number;
  user: string | null;
  pass: string | null;
  from: string;
}

export interface AppConfig {
  nodeEnv: string;
  port: number;
  database: DatabaseConfig;
  jwt: JwtConfig;
  cookie: CookieConfig;
  cors: CorsConfig;
  market: MarketConfig;
  ai: AiConfig;
  mail: MailConfig;
  resetTokenTtl: number;
  budgetWarningThreshold: number;
  supportedCurrencies: string[];
  defaultCurrency: string;
}

const toNumber = (value: string | undefined, fallback: number): number => {
  if (value === undefined || value.trim() === "") return fallback;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
};

const toBoolean = (value: string | undefined, fallback: boolean): boolean => {
  if (value === undefined) return fallback;
  return value.toLowerCase() === "true";
};

const toList = (value: string | undefined, fallback: string[]): string[] => {
  if (!value) return fallback;
  return value
    .split(",")
    .map((item) => item.trim())
    .filter((item) => item.length > 0);
};

export const configuration = (): AppConfig => ({
  nodeEnv: process.env.NODE_ENV ?? "development",
  port: toNumber(process.env.PORT, 3001),
  database: {
    url: process.env.DATABASE_URL ?? "",
    ssl: toBoolean(process.env.DB_SSL, false),
  },
  jwt: {
    accessSecret: process.env.JWT_ACCESS_SECRET ?? "",
    refreshSecret: process.env.JWT_REFRESH_SECRET ?? "",
    accessTtl: toNumber(process.env.JWT_ACCESS_TTL, 900),
    refreshTtlDays: toNumber(process.env.JWT_REFRESH_TTL_DAYS, 30),
  },
  cookie: {
    secure: toBoolean(process.env.COOKIE_SECURE, false),
    sameSite: (process.env.COOKIE_SAME_SITE ??
      "lax") as CookieConfig["sameSite"],
  },
  cors: {
    origin: process.env.CORS_ORIGIN ?? "http://localhost:3000",
    native: toList(process.env.CORS_ORIGIN_NATIVE, ["capacitor://localhost"]),
  },
  market: {
    enabled: toBoolean(
      process.env.MARKET_ENABLED,
      process.env.NODE_ENV !== "test",
    ),
    cryptoUrl: process.env.MARKET_API_URL || "https://api.binance.com/api/v3",
    fxUrl:
      process.env.FX_API_URL ||
      "https://cdn.jsdelivr.net/npm/@fawazahmed0/currency-api@latest/v1/currencies",
    vsCurrency: (process.env.MARKET_VS_CURRENCY || "USD").toUpperCase(),
    timeoutMs: toNumber(process.env.MARKET_TIMEOUT_MS, 8000),
    refreshIntervalMs: toNumber(process.env.MARKET_REFRESH_INTERVAL_MS, 300000),
    symbols: toList(process.env.MARKET_SYMBOLS, [
      "BTC",
      "ETH",
      "USDT",
      "USDC",
      "SOL",
      "BNB",
    ]),
    quoteStaleMs: toNumber(process.env.QUOTE_STALE_MS, 3600000),
  },
  ai: {
    provider: process.env.AI_PROVIDER ?? "deepseek",
    apiKey: process.env.AI_API_KEY || null,
    baseUrl:
      process.env.AI_BASE_URL ||
      (process.env.AI_PROVIDER === "openai"
        ? "https://api.openai.com/v1"
        : "https://api.deepseek.com"),
    model:
      process.env.AI_MODEL ||
      (process.env.AI_PROVIDER === "openai" ? "gpt-4o-mini" : "deepseek-chat"),
    timeoutMs: toNumber(process.env.AI_TIMEOUT_MS, 30000),
    devUserEmail: process.env.AI_DEV_USER_EMAIL || "demo@atlassfin.app",
    actionTtlMs: toNumber(process.env.AI_ACTION_TTL_MS, 120000),
  },
  mail: {
    host: process.env.SMTP_HOST || null,
    port: toNumber(process.env.SMTP_PORT, 587),
    user: process.env.SMTP_USER || null,
    pass: process.env.SMTP_PASS || null,
    from: process.env.MAIL_FROM ?? "no-reply@example.com",
  },
  resetTokenTtl: toNumber(process.env.RESET_TOKEN_TTL, 3600),
  budgetWarningThreshold: toNumber(process.env.BUDGET_WARNING_THRESHOLD, 0.8),
  supportedCurrencies: toList(process.env.SUPPORTED_CURRENCIES, [
    "ARS",
    "USD",
    "EUR",
    "BRL",
    "UYU",
  ]),
  defaultCurrency: process.env.DEFAULT_CURRENCY ?? "ARS",
});
