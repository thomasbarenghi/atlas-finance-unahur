export interface DatabaseConfig {
  url: string;
  ssl: boolean;
  /** Máximo de conexiones del pool de `pg` por instancia. */
  poolMax: number;
  /** Tiempo máximo de espera para obtener una conexión del pool (ms). */
  connectionTimeoutMs: number;
  /**
   * Tiempo que una conexión ociosa permanece abierta (ms). Mantenerlo alto
   * evita pagar el handshake TLS contra Supabase en cada visita.
   */
  idleTimeoutMs: number;
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
  apiKey: string | null;
  baseUrl: string;
  model: string;
  timeoutMs: number;
}

export interface AppConfig {
  port: number;
  database: DatabaseConfig;
  jwt: JwtConfig;
  cookie: CookieConfig;
  cors: CorsConfig;
  ai: AiConfig;
}

const toNumber = (value: string | undefined, fallback: number): number =>
  value?.trim() && Number.isFinite(Number(value)) ? Number(value) : fallback;

const toList = (value: string | undefined, fallback: string[]): string[] =>
  value
    ? value
        .split(",")
        .map((item) => item.trim())
        .filter((item) => item.length > 0)
    : fallback;

export const configuration = (): AppConfig => ({
  port: toNumber(process.env.PORT, 3001),
  database: {
    url: process.env.DATABASE_URL ?? "",
    ssl: process.env.DB_SSL === "true",
    poolMax: toNumber(process.env.DB_POOL_MAX, 5),
    connectionTimeoutMs: toNumber(process.env.DB_CONNECTION_TIMEOUT_MS, 15000),
    idleTimeoutMs: toNumber(process.env.DB_IDLE_TIMEOUT_MS, 300000),
  },
  jwt: {
    accessSecret: process.env.JWT_ACCESS_SECRET ?? "",
    accessTtl: toNumber(process.env.JWT_ACCESS_TTL, 900),
    refreshTtlDays: toNumber(process.env.JWT_REFRESH_TTL_DAYS, 30),
  },
  cookie: {
    secure: process.env.COOKIE_SECURE === "true",
    sameSite: (process.env.COOKIE_SAME_SITE ??
      "lax") as CookieConfig["sameSite"],
  },
  cors: {
    origins: toList(process.env.CORS_ORIGIN, ["http://localhost:3000"]),
  },
  ai: {
    apiKey: process.env.AI_API_KEY || null,
    baseUrl: process.env.AI_BASE_URL ?? "https://api.deepseek.com",
    model: process.env.AI_MODEL ?? "deepseek-chat",
    timeoutMs: toNumber(process.env.AI_TIMEOUT_MS, 30000),
  },
});
