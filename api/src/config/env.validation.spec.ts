import { validateEnv } from "./env.validation";

const validEnv = (): Record<string, string> => ({
  DATABASE_URL: "postgres://x",
  JWT_ACCESS_SECRET: "a",
  JWT_REFRESH_SECRET: "b",
});

describe("validateEnv", () => {
  it("returns the env when valid", () => {
    const env = {
      ...validEnv(),
      NODE_ENV: "test",
      PORT: "3001",
      MARKET_ENABLED: "false",
    };
    expect(validateEnv(env)).toBe(env);
  });

  it("throws when required variables are missing", () => {
    expect(() => validateEnv({})).toThrow(/missing required variables/);
    expect(() => validateEnv({ DATABASE_URL: "x" })).toThrow(
      /JWT_ACCESS_SECRET/,
    );
  });

  it("rejects invalid enum values", () => {
    expect(() => validateEnv({ ...validEnv(), NODE_ENV: "staging" })).toThrow(
      /NODE_ENV/,
    );
    expect(() =>
      validateEnv({ ...validEnv(), COOKIE_SAME_SITE: "invalid" }),
    ).toThrow(/COOKIE_SAME_SITE/);
    expect(() => validateEnv({ ...validEnv(), MARKET_ENABLED: "yes" })).toThrow(
      /MARKET_ENABLED/,
    );
  });

  it("rejects non-numeric values", () => {
    expect(() => validateEnv({ ...validEnv(), PORT: "abc" })).toThrow(/PORT/);
    expect(() =>
      validateEnv({ ...validEnv(), BUDGET_WARNING_THRESHOLD: "x" }),
    ).toThrow(/BUDGET_WARNING_THRESHOLD/);
  });

  it("ignores empty optional values", () => {
    expect(() => validateEnv({ ...validEnv(), PORT: "" })).not.toThrow();
  });
});
