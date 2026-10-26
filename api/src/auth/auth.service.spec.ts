import * as argon2 from "argon2";
import { createHash } from "crypto";
import { ErrorCode } from "../common/errors/error-codes";
import { mockRepository } from "../../test/unit/mocks";
import { User } from "../users/entities/user.entity";
import { Session } from "./entities/session.entity";
import { AuthService } from "./auth.service";

jest.mock("argon2", () => ({
  hash: jest.fn(async () => "hashed"),
  verify: jest.fn(async () => true),
}));

const mockedArgon2 = argon2 as jest.Mocked<typeof argon2>;

const user = (overrides: Partial<User> = {}): User =>
  ({
    id: "u1",
    name: "Ana",
    email: "ana@test.local",
    passwordHash: "hashed",
    createdAt: new Date("2026-01-01T00:00:00.000Z"),
    ...overrides,
  }) as User;

const sha256 = (value: string): string =>
  createHash("sha256").update(value).digest("hex");

const session = (overrides: Partial<Session> = {}): Session =>
  ({
    id: "s1",
    userId: "u1",
    refreshTokenHash: sha256("secret"),
    expiresAt: new Date(Date.now() + 86_400_000),
    revokedAt: null,
    createdAt: new Date("2026-01-01T00:00:00.000Z"),
    ...overrides,
  }) as Session;

const build = () => {
  const usersRepository = mockRepository();
  usersRepository.create.mockImplementation((value: any) => ({
    ...user(),
    ...value,
  }));
  usersRepository.save.mockImplementation(async (value: any) => ({
    ...user(),
    ...value,
  }));
  const sessionsRepository = mockRepository();
  const jwtService = { sign: jest.fn(() => "access-token") };
  const config = {
    get: jest.fn((key: string) => {
      if (key === "jwt") return { refreshTtlDays: 30 };
      return undefined;
    }),
  };

  const sessionCache = { delete: jest.fn(), remember: jest.fn() };
  const service = new AuthService(
    usersRepository as any,
    sessionsRepository as any,
    jwtService as any,
    config as any,
    sessionCache as any,
  );
  return {
    service,
    usersRepository,
    sessionsRepository,
    jwtService,
    sessionCache,
  };
};

describe("AuthService", () => {
  beforeEach(() => jest.clearAllMocks());

  it("registers a user, hashing the password and opening a session", async () => {
    const { service, usersRepository, sessionsRepository } = build();
    usersRepository.findOneBy.mockResolvedValue(null);
    usersRepository.save.mockImplementation(async (value: any) => value);

    const result = await service.register({
      name: "  Ana  ",
      email: "ANA@test.local",
      password: "Secreta123",
    } as any);

    expect(usersRepository.create).toHaveBeenCalledWith(
      expect.objectContaining({
        name: "Ana",
        email: "ana@test.local",
        passwordHash: "hashed",
      }),
    );
    expect(sessionsRepository.save).toHaveBeenCalled();
    expect(result).toMatchObject({ accessToken: "access-token" });
  });

  it("rejects a duplicate email", async () => {
    const { service, usersRepository } = build();
    usersRepository.findOneBy.mockResolvedValue(user());

    await expect(
      service.register({
        name: "Ana",
        email: "ana@test.local",
        password: "Secreta123",
      } as any),
    ).rejects.toMatchObject({ response: { code: ErrorCode.EMAIL_IN_USE } });
  });

  it("logs in with valid credentials", async () => {
    const { service, usersRepository } = build();
    usersRepository.findOneBy.mockResolvedValue(user());

    await expect(
      service.login({ email: "ANA@test.local", password: "Secreta123" } as any),
    ).resolves.toMatchObject({ accessToken: "access-token" });
  });

  it("rejects invalid credentials", async () => {
    const { service, usersRepository } = build();
    usersRepository.findOneBy.mockResolvedValue(user());
    mockedArgon2.verify.mockResolvedValueOnce(false);

    await expect(
      service.login({ email: "ana@test.local", password: "bad" } as any),
    ).rejects.toMatchObject({
      response: { code: ErrorCode.INVALID_CREDENTIALS },
    });
  });

  it("rotates the refresh token", async () => {
    const { service, usersRepository, sessionsRepository, sessionCache } =
      build();
    sessionsRepository.findOneBy.mockResolvedValue(session());
    usersRepository.findOneBy.mockResolvedValue(user());

    const tokens = await service.refresh("s1.secret");
    expect(tokens.accessToken).toBe("access-token");
    expect(tokens.refreshToken.startsWith("s1.")).toBe(true);
    expect(sessionsRepository.update).toHaveBeenCalledWith(
      { id: "s1" },
      { refreshTokenHash: expect.stringMatching(/^[a-f0-9]{64}$/) },
    );
    expect(sessionCache.remember).toHaveBeenCalledWith(
      "s1",
      { id: "u1", email: "ana@test.local", sessionId: "s1" },
      expect.any(Date),
    );
    expect(mockedArgon2.verify).not.toHaveBeenCalled();
  });

  it("accepts a legacy argon2 refresh hash and rotates it to SHA-256", async () => {
    const { service, usersRepository, sessionsRepository } = build();
    sessionsRepository.findOneBy.mockResolvedValue(
      session({ refreshTokenHash: "$argon2id$legacy" }),
    );
    usersRepository.findOneBy.mockResolvedValue(user());
    mockedArgon2.verify.mockResolvedValueOnce(true);

    await expect(service.refresh("s1.secret")).resolves.toMatchObject({
      accessToken: "access-token",
    });
    expect(mockedArgon2.verify).toHaveBeenCalledWith(
      "$argon2id$legacy",
      "secret",
    );
  });

  it("rejects a wrong refresh secret", async () => {
    const { service, sessionsRepository } = build();
    sessionsRepository.findOneBy.mockResolvedValue(session());

    await expect(service.refresh("s1.wrong")).rejects.toMatchObject({
      response: { code: ErrorCode.SESSION_REVOKED },
    });
  });

  it("rejects an unknown or revoked refresh token", async () => {
    const { service, sessionsRepository } = build();

    await expect(service.refresh(undefined)).rejects.toMatchObject({
      response: { code: ErrorCode.SESSION_REVOKED },
    });

    sessionsRepository.findOneBy.mockResolvedValue(
      session({ revokedAt: new Date() }),
    );
    await expect(service.refresh("s1.secret")).rejects.toMatchObject({
      response: { code: ErrorCode.SESSION_REVOKED },
    });
  });

  it("revokes the session on logout and clears its cache entry", async () => {
    const { service, sessionsRepository, sessionCache } = build();
    await service.logout("u1", "s1");
    expect(sessionsRepository.update).toHaveBeenCalledWith(
      { id: "s1", userId: "u1" },
      { revokedAt: expect.any(Date) },
    );
    expect(sessionCache.delete).toHaveBeenCalledWith("s1");
  });

  it("returns the current user profile", async () => {
    const { service, usersRepository } = build();
    usersRepository.findOneBy.mockResolvedValue(user());
    await expect(service.getMe("u1")).resolves.toMatchObject({
      email: "ana@test.local",
    });
  });

  it("throws NOT_FOUND when the profile is gone", async () => {
    const { service, usersRepository } = build();
    usersRepository.findOneBy.mockResolvedValue(null);
    await expect(service.getMe("u1")).rejects.toMatchObject({
      response: { code: ErrorCode.NOT_FOUND },
    });
  });
});
