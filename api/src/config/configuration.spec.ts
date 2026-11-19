import { configuration } from "./configuration";

const KEYS = [
  "PORT",
  "DATABASE_URL",
  "DB_SSL",
  "DB_POOL_MAX",
  "DB_CONNECTION_TIMEOUT_MS",
  "DB_IDLE_TIMEOUT_MS",
  "JWT_ACCESS_SECRET",
  "JWT_ACCESS_TTL",
  "JWT_REFRESH_TTL_DAYS",
  "COOKIE_SECURE",
  "COOKIE_SAME_SITE",
  "CORS_ORIGIN",
  "AI_API_KEY",
  "AI_BASE_URL",
  "AI_MODEL",
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
    expect(config.port).toBe(3001);
    expect(config.database).toEqual({
      url: "",
      ssl: false,
      poolMax: 5,
      connectionTimeoutMs: 15000,
      idleTimeoutMs: 300000,
    });
    expect(config.jwt.accessTtl).toBe(900);
    expect(config.jwt.refreshTtlDays).toBe(30);
    expect(config.cookie.sameSite).toBe("lax");
    expect(config.ai.apiKey).toBeNull();
    expect(config.ai.model).toBe("deepseek-chat");
  });

  it("parses numbers, booleans and lists from the environment", () => {
    process.env.PORT = "8080";
    process.env.DATABASE_URL = "postgres://x";
    process.env.DB_SSL = "true";
    process.env.JWT_ACCESS_TTL = "60";
    process.env.COOKIE_SECURE = "true";
    process.env.COOKIE_SAME_SITE = "strict";
    process.env.CORS_ORIGIN = "a, b ,c";
    process.env.AI_API_KEY = "sk-1";
    process.env.AI_MODEL = "gpt-4o-mini";

    const config = configuration();
    expect(config.port).toBe(8080);
    expect(config.database.ssl).toBe(true);
    expect(config.jwt.accessTtl).toBe(60);
    expect(config.cookie).toEqual({ secure: true, sameSite: "strict" });
    expect(config.cors.origins).toEqual(["a", "b", "c"]);
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
