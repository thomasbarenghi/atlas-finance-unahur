export interface DatabaseConfig {
  url: string;
  ssl: boolean;
  /** Máximo de conexiones del pool de `pg` por instancia. */
  poolMax: number;
  /** Tiempo máximo de espera para obtener una conexión del pool (ms). */
  connectionTimeoutMs: number;
}

export interface JwtConfig {
  accessSecret: string;
  accessTtl: number;
  refreshTtlDays: number;
}

export interface CookieConfig {
  secure: boolean;
  sameSite: "lax" | "strict" | "none";
}

export interface CorsConfig {
  origins: string[];
}

export interface AiConfig {
  provider: string;
  apiKey: string | null;
  baseUrl: string;
  model: string;
  timeoutMs: number;
  devUserEmail: string;
}

export interface DevConfig {
  /**
   * Whether the destructive dev endpoints are enabled. Fail-closed: it is only
   * true when `NODE_ENV` is *explicitly* `development` or `test`, never from the
   * defaulted `nodeEnv` (so a production deploy missing `NODE_ENV` stays safe).
   */
  databaseResetEnabled: boolean;
  /** Shared secret required by the dev-only database endpoints when set. */
  databaseToken: string | null;
}

export interface AppConfig {
  nodeEnv: string;
  port: number;
  database: DatabaseConfig;
  jwt: JwtConfig;
  cookie: CookieConfig;
  cors: CorsConfig;
  ai: AiConfig;
  dev: DevConfig;
  /** Única moneda del sistema, usada para mostrar montos (FR de alcance 0.3). */
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
    poolMax: toNumber(process.env.DB_POOL_MAX, 5),
    connectionTimeoutMs: toNumber(process.env.DB_CONNECTION_TIMEOUT_MS, 15000),
  },
  jwt: {
    accessSecret: process.env.JWT_ACCESS_SECRET ?? "",
    accessTtl: toNumber(process.env.JWT_ACCESS_TTL, 900),
    refreshTtlDays: toNumber(process.env.JWT_REFRESH_TTL_DAYS, 30),
  },
  cookie: {
    secure: toBoolean(process.env.COOKIE_SECURE, false),
    sameSite: (process.env.COOKIE_SAME_SITE ??
      "lax") as CookieConfig["sameSite"],
  },
  cors: {
    origins: toList(process.env.CORS_ORIGIN, ["http://localhost:3000"]),
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
  },
  dev: {
    databaseResetEnabled: ["development", "test"].includes(
      process.env.NODE_ENV ?? "",
    ),
    databaseToken: process.env.DEV_DATABASE_TOKEN || null,
  },
  defaultCurrency: process.env.DEFAULT_CURRENCY ?? "ARS",
});
