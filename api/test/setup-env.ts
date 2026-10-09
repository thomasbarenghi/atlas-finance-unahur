/**
 * Environment for the HTTP e2e suite. Loaded by jest `setupFiles` before any
 * module import, so `@nestjs/config` reads these values (dotenv does not
 * override already-set process.env values).
 *
 * The suite never touches the developer/production database: it always targets
 * a dedicated local test database.
 */
import "reflect-metadata";

process.env.NODE_ENV = "test";

process.env.DATABASE_URL =
  process.env.TEST_DATABASE_URL ??
  "postgresql://localhost:5432/atlas_finance_test";
process.env.DB_SSL = "false";

process.env.JWT_ACCESS_SECRET = "test-access-secret";
process.env.JWT_REFRESH_SECRET = "test-refresh-secret";
process.env.JWT_ACCESS_TTL = "900";
process.env.JWT_REFRESH_TTL_DAYS = "30";

process.env.COOKIE_SECURE = "false";
process.env.COOKIE_SAME_SITE = "lax";

process.env.MARKET_ENABLED = "false";
process.env.QUOTE_STALE_MS = "3600000";
process.env.MARKET_REFRESH_INTERVAL_MS = "300000";
process.env.MARKET_TIMEOUT_MS = "8000";

process.env.BUDGET_WARNING_THRESHOLD = "0.8";
process.env.RESET_TOKEN_TTL = "3600";

process.env.SUPPORTED_CURRENCIES = "ARS,USD,EUR,BRL,UYU";
process.env.DEFAULT_CURRENCY = "ARS";

delete process.env.AI_API_KEY;
process.env.AI_DEV_USER_EMAIL = "demo@atlassfin.app";
