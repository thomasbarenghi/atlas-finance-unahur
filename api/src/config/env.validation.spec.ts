import { validateEnv } from "./env.validation";

const validEnv = (): Record<string, string> => ({
  DATABASE_URL: "postgres://x",
  JWT_ACCESS_SECRET: "a",
});

describe("validateEnv", () => {
  it("returns the env when valid", () => {
    const env = {
      ...validEnv(),
      NODE_ENV: "test",
      PORT: "3001",
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
  });

  it("rejects non-numeric values", () => {
    expect(() => validateEnv({ ...validEnv(), PORT: "abc" })).toThrow(/PORT/);
    expect(() => validateEnv({ ...validEnv(), AI_TIMEOUT_MS: "x" })).toThrow(
      /AI_TIMEOUT_MS/,
    );
  });

  it("ignores empty optional values", () => {
    expect(() => validateEnv({ ...validEnv(), PORT: "" })).not.toThrow();
  });
});
