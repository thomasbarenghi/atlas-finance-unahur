import { UnauthorizedException } from "@nestjs/common";
import { JwtStrategy } from "./jwt.strategy";
import { SessionValidationCache } from "./session-validation-cache.service";

const payload = { sub: "u1", email: "a@test.local", sid: "s1" };

const build = () => {
  const config = {
    get: jest.fn(() => ({ accessSecret: "secret" })),
  };
  const sessionsRepository = { findOneBy: jest.fn() };
  const cacheConfig = { get: jest.fn(() => 30_000) };
  const sessionCache = new SessionValidationCache(cacheConfig as any);
  const strategy = new JwtStrategy(
    config as any,
    sessionsRepository as any,
    sessionCache,
  );
  return { strategy, sessionsRepository, sessionCache };
};

const activeSession = () => ({
  id: "s1",
  revokedAt: null,
  expiresAt: new Date(Date.now() + 1_000_000),
});

describe("JwtStrategy", () => {
  it("returns the authenticated user for an active session", async () => {
    const { strategy, sessionsRepository } = build();
    sessionsRepository.findOneBy.mockResolvedValue(activeSession());

    await expect(strategy.validate(payload)).resolves.toEqual({
      id: "u1",
      email: "a@test.local",
      sessionId: "s1",
    });
  });

  it("caches a valid session and skips the database on the next call", async () => {
    const { strategy, sessionsRepository } = build();
    sessionsRepository.findOneBy.mockResolvedValue(activeSession());

    await strategy.validate(payload);
    await strategy.validate(payload);

    expect(sessionsRepository.findOneBy).toHaveBeenCalledTimes(1);
  });

  it("coalesces concurrent validations of the same session", async () => {
    const { strategy, sessionsRepository } = build();
    sessionsRepository.findOneBy.mockResolvedValue(activeSession());

    const [first, second] = await Promise.all([
      strategy.validate(payload),
      strategy.validate(payload),
    ]);

    expect(sessionsRepository.findOneBy).toHaveBeenCalledTimes(1);
    expect(first).toEqual(second);
  });

  it("rejects missing, revoked or expired sessions without caching them", async () => {
    const { strategy, sessionsRepository } = build();

    sessionsRepository.findOneBy.mockResolvedValue(null);
    await expect(strategy.validate(payload)).rejects.toBeInstanceOf(
      UnauthorizedException,
    );

    sessionsRepository.findOneBy.mockResolvedValue({
      id: "s1",
      revokedAt: new Date(),
      expiresAt: new Date(Date.now() + 1_000_000),
    });
    await expect(strategy.validate(payload)).rejects.toBeInstanceOf(
      UnauthorizedException,
    );

    sessionsRepository.findOneBy.mockResolvedValue({
      id: "s1",
      revokedAt: null,
      expiresAt: new Date(Date.now() - 1_000),
    });
    await expect(strategy.validate(payload)).rejects.toBeInstanceOf(
      UnauthorizedException,
    );

    expect(sessionsRepository.findOneBy).toHaveBeenCalledTimes(3);
  });
});
