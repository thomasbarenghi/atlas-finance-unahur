export interface RawEnv {
  [key: string]: string | undefined;
}

const REQUIRED_KEYS = [
  "DATABASE_URL",
  "JWT_ACCESS_SECRET",
  "JWT_REFRESH_SECRET",
] as const;

const ALLOWED_NODE_ENVS = ["development", "production", "test"];
const ALLOWED_SAME_SITE = ["lax", "strict", "none"];
const ALLOWED_BOOLEANS = ["true", "false"];

const assertNumeric = (env: RawEnv, key: string): void => {
  const value = env[key];
  if (value !== undefined && value !== "" && !Number.isFinite(Number(value))) {
    throw new Error(`Environment validation failed: ${key} must be a number`);
  }
};

const assertAllowed = (env: RawEnv, key: string, allowed: string[]): void => {
  const value = env[key];
  if (value !== undefined && value !== "" && !allowed.includes(value)) {
    throw new Error(
      `Environment validation failed: ${key} must be one of ${allowed.join(", ")}`,
    );
  }
};

export const validateEnv = (env: RawEnv): RawEnv => {
  const missing = REQUIRED_KEYS.filter((key) => !env[key]);
  if (missing.length > 0) {
    throw new Error(
      `Environment validation failed: missing required variables ${missing.join(", ")}`,
    );
  }

  assertAllowed(env, "NODE_ENV", ALLOWED_NODE_ENVS);
  assertAllowed(env, "COOKIE_SAME_SITE", ALLOWED_SAME_SITE);
  assertAllowed(env, "MARKET_ENABLED", ALLOWED_BOOLEANS);
  assertNumeric(env, "PORT");
  assertNumeric(env, "JWT_ACCESS_TTL");
  assertNumeric(env, "JWT_REFRESH_TTL_DAYS");
  assertNumeric(env, "BUDGET_WARNING_THRESHOLD");
  assertNumeric(env, "QUOTE_STALE_MS");
  assertNumeric(env, "MARKET_REFRESH_INTERVAL_MS");
  assertNumeric(env, "MARKET_TIMEOUT_MS");
  assertNumeric(env, "AI_TIMEOUT_MS");
  assertNumeric(env, "RESET_TOKEN_TTL");

  return env;
};
