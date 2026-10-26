import { AuthUser } from "../common/types/auth-user";
import { SessionValidationCache } from "./session-validation-cache.service";

const user: AuthUser = { id: "u1", email: "a@test.local", sessionId: "s1" };

const build = (ttl = 30_000) => {
  const config = { get: jest.fn(() => ttl) };
  return new SessionValidationCache(config as any);
};

const sessionExpiringIn = (ms: number) => new Date(Date.now() + ms);
const loader = (expiresAt: Date) =>
  jest.fn().mockResolvedValue({ user, expiresAt });

describe("SessionValidationCache", () => {
  afterEach(() => {
    jest.useRealTimers();
  });

  it("returns the cached user and loads only once", async () => {
    const cache = build();
    const load = loader(sessionExpiringIn(60_000));

    await expect(cache.getOrValidate("s1", load)).resolves.toEqual(user);
    await expect(cache.getOrValidate("s1", load)).resolves.toEqual(user);

    expect(load).toHaveBeenCalledTimes(1);
  });

  it("coalesces concurrent validations of the same session", async () => {
    const cache = build();
    const load = loader(sessionExpiringIn(60_000));

    const [first, second] = await Promise.all([
      cache.getOrValidate("s1", load),
      cache.getOrValidate("s1", load),
    ]);

    expect(load).toHaveBeenCalledTimes(1);
    expect(first).toEqual(second);
  });

  it("expires entries after the TTL", async () => {
    jest.useFakeTimers().setSystemTime(new Date("2026-01-01T00:00:00.000Z"));
    const cache = build(30_000);
    const load = loader(sessionExpiringIn(60_000));

    await cache.getOrValidate("s1", load);
    jest.setSystemTime(new Date("2026-01-01T00:00:30.001Z"));
    await cache.getOrValidate("s1", load);

    expect(load).toHaveBeenCalledTimes(2);
  });

  it("never caches beyond the session expiry", async () => {
    jest.useFakeTimers().setSystemTime(new Date("2026-01-01T00:00:00.000Z"));
    const cache = build(30_000);
    const load = loader(sessionExpiringIn(5_000));

    await cache.getOrValidate("s1", load);
    jest.setSystemTime(new Date("2026-01-01T00:00:05.001Z"));
    await cache.getOrValidate("s1", load);

    expect(load).toHaveBeenCalledTimes(2);
  });

  it("does not cache when the TTL is disabled", async () => {
    const cache = build(0);
    const load = loader(sessionExpiringIn(60_000));

    await cache.getOrValidate("s1", load);
    await cache.getOrValidate("s1", load);

    expect(load).toHaveBeenCalledTimes(2);
    expect(cache.get("s1")).toBeNull();
  });

  it("drops an entry on delete", async () => {
    const cache = build();
    const load = loader(sessionExpiringIn(60_000));

    await cache.getOrValidate("s1", load);
    cache.delete("s1");
    await cache.getOrValidate("s1", load);

    expect(load).toHaveBeenCalledTimes(2);
  });
});
