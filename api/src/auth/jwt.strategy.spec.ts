import { UnauthorizedException } from "@nestjs/common";
import { JwtStrategy } from "./jwt.strategy";

const build = () => {
  const config = {
    get: jest.fn(() => ({ accessSecret: "secret" })),
  };
  const sessionsRepository = { findOneBy: jest.fn() };
  const strategy = new JwtStrategy(config as any, sessionsRepository as any);
  return { strategy, sessionsRepository };
};

describe("JwtStrategy", () => {
  it("returns the authenticated user for an active session", async () => {
    const { strategy, sessionsRepository } = build();
    sessionsRepository.findOneBy.mockResolvedValue({
      id: "s1",
      revokedAt: null,
      expiresAt: new Date(Date.now() + 1000_000),
    });

    await expect(
      strategy.validate({ sub: "u1", email: "a@test.local", sid: "s1" }),
    ).resolves.toEqual({ id: "u1", email: "a@test.local", sessionId: "s1" });
  });

  it("rejects missing, revoked or expired sessions", async () => {
    const { strategy, sessionsRepository } = build();

    sessionsRepository.findOneBy.mockResolvedValue(null);
    await expect(
      strategy.validate({ sub: "u1", email: "a@test.local", sid: "s1" }),
    ).rejects.toBeInstanceOf(UnauthorizedException);

    sessionsRepository.findOneBy.mockResolvedValue({
      id: "s1",
      revokedAt: new Date(),
      expiresAt: new Date(Date.now() + 1000_000),
    });
    await expect(
      strategy.validate({ sub: "u1", email: "a@test.local", sid: "s1" }),
    ).rejects.toBeInstanceOf(UnauthorizedException);

    sessionsRepository.findOneBy.mockResolvedValue({
      id: "s1",
      revokedAt: null,
      expiresAt: new Date(Date.now() - 1000),
    });
    await expect(
      strategy.validate({ sub: "u1", email: "a@test.local", sid: "s1" }),
    ).rejects.toBeInstanceOf(UnauthorizedException);
  });
});
