import { configuration } from "./configuration";

const KEYS = [
  "NODE_ENV",
  "PORT",
  "DATABASE_URL",
  "DB_SSL",
  "JWT_ACCESS_SECRET",
  "JWT_REFRESH_SECRET",
  "JWT_ACCESS_TTL",
  "JWT_REFRESH_TTL_DAYS",
  "COOKIE_SECURE",
  "COOKIE_SAME_SITE",
  "CORS_ORIGIN",
  "CORS_ORIGIN_NATIVE",
  "MARKET_ENABLED",
  "MARKET_SYMBOLS",
  "SUPPORTED_CURRENCIES",
  "DEFAULT_CURRENCY",
  "BUDGET_WARNING_THRESHOLD",
  "RESET_TOKEN_TTL",
  "QUOTE_STALE_MS",
  "AI_PROVIDER",
  "AI_API_KEY",
  "AI_MODEL",
  "MAIL_FROM",
  "DEV_DATABASE_TOKEN",
];

describe("configuration", () => {
  const original: Record<string, string | undefined> = {};

  beforeEach(() => {
    for (const key of KEYS) {
      original[key] = process.env[key];
      delete process.env[key];
    }
  });

  afterEach(() => {
    for (const key of KEYS) {
      if (original[key] === undefined) delete process.env[key];
      else process.env[key] = original[key];
    }
  });

  it("applies sensible defaults when nothing is set", () => {
    const config = configuration();
    expect(config.nodeEnv).toBe("development");
    expect(config.port).toBe(3001);
    expect(config.database).toEqual({ url: "", ssl: false });
    expect(config.jwt.accessTtl).toBe(900);
    expect(config.jwt.refreshTtlDays).toBe(30);
    expect(config.cookie.sameSite).toBe("lax");
    expect(config.market.enabled).toBe(true); // NODE_ENV != test
    expect(config.market.symbols).toEqual([
      "BTC",
      "ETH",
      "USDT",
      "USDC",
      "SOL",
      "BNB",
    ]);
    expect(config.supportedCurrencies).toEqual([
      "ARS",
      "USD",
      "EUR",
      "BRL",
      "UYU",
    ]);
    expect(config.defaultCurrency).toBe("ARS");
    expect(config.ai.provider).toBe("deepseek");
    expect(config.ai.apiKey).toBeNull();
    expect(config.ai.model).toBe("deepseek-chat");
    expect(config.dev.databaseToken).toBeNull();
    // Fail-closed: without an explicit NODE_ENV the dev endpoints are disabled.
    expect(config.dev.databaseResetEnabled).toBe(false);
    expect(config.resetTokenTtl).toBe(3600);
  });

  it("enables the dev database endpoints only for explicit dev/test", () => {
    process.env.NODE_ENV = "test";
    expect(configuration().dev.databaseResetEnabled).toBe(true);

    process.env.NODE_ENV = "production";
    expect(configuration().dev.databaseResetEnabled).toBe(false);
  });

  it("parses numbers, booleans and lists from the environment", () => {
    process.env.NODE_ENV = "production";
    process.env.PORT = "8080";
    process.env.DATABASE_URL = "postgres://x";
    process.env.DB_SSL = "true";
    process.env.JWT_ACCESS_TTL = "60";
    process.env.COOKIE_SECURE = "true";
    process.env.COOKIE_SAME_SITE = "strict";
    process.env.CORS_ORIGIN_NATIVE = "a, b ,c";
    process.env.MARKET_ENABLED = "false";
    process.env.MARKET_SYMBOLS = "BTC,ETH";
    process.env.SUPPORTED_CURRENCIES = "USD";
    process.env.BUDGET_WARNING_THRESHOLD = "0.5";
    process.env.AI_PROVIDER = "openai";
    process.env.AI_API_KEY = "sk-1";

    const config = configuration();
    expect(config.nodeEnv).toBe("production");
    expect(config.port).toBe(8080);
    expect(config.database.ssl).toBe(true);
    expect(config.jwt.accessTtl).toBe(60);
    expect(config.cookie).toEqual({ secure: true, sameSite: "strict" });
    expect(config.cors.native).toEqual(["a", "b", "c"]);
    expect(config.market.enabled).toBe(false);
    expect(config.market.symbols).toEqual(["BTC", "ETH"]);
    expect(config.supportedCurrencies).toEqual(["USD"]);
    expect(config.budgetWarningThreshold).toBe(0.5);
    expect(config.ai.provider).toBe("openai");
    expect(config.ai.model).toBe("gpt-4o-mini");
    expect(config.ai.apiKey).toBe("sk-1");
  });

  it("falls back when numeric values are empty or invalid", () => {
    process.env.PORT = "";
    process.env.JWT_ACCESS_TTL = "not-a-number";
    const config = configuration();
    expect(config.port).toBe(3001);
    expect(config.jwt.accessTtl).toBe(900);
  });
});
