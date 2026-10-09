import { createHash } from "crypto";
import { ErrorCode } from "../common/errors/error-codes";
import { AuthService } from "./auth.service";

jest.mock("argon2", () => ({
  hash: jest.fn(async () => "$argon2id$hashed"),
  verify: jest.fn(async () => true),
}));

const argon2 = require("argon2") as {
  hash: jest.Mock;
  verify: jest.Mock;
};
const buildUser = (overrides: Record<string, unknown> = {}) => ({
  id: "u1",
  name: "Ana",
  email: "ana@test.local",
  passwordHash: "$argon2id$hashed",
  baseCurrency: "ARS",
  theme: "system",
  aiEnabled: false,
  assistantDestructiveEnabled: false,
  resetTokenHash: null,
  resetTokenExpiresAt: null,
  createdAt: new Date("2026-01-01T00:00:00.000Z"),
  ...overrides,
});

const build = () => {
  const usersRepository = {
    findOneBy: jest.fn(),
    create: jest.fn((value: any) => ({
      id: "u1",
      createdAt: new Date("2026-01-01T00:00:00.000Z"),
      ...value,
    })),
    save: jest.fn(async (value: any) => ({
      id: value.id ?? "u1",
      createdAt: value.createdAt ?? new Date("2026-01-01T00:00:00.000Z"),
      ...value,
    })),
  };
  const sessionsRepository = {
    create: jest.fn((value: unknown) => value),
    save: jest.fn(async (value: unknown) => value),
    findOneBy: jest.fn(),
    update: jest.fn().mockResolvedValue({ affected: 1 }),
  };
  const jwtService = {
    sign: jest.fn(() => "access-token"),
    signAsync: jest.fn(async () => "reset-token"),
    verifyAsync: jest.fn(),
  };
  const config = {
    get: jest.fn((key: string) => {
      if (key === "jwt") return { accessTtl: 900, refreshTtlDays: 30 };
      if (key === "resetTokenTtl") return 3600;
      return undefined;
    }),
  };
  const mailService = { sendPasswordReset: jest.fn(async () => undefined) };

  const service = new AuthService(
    usersRepository as any,
    sessionsRepository as any,
    jwtService as any,
    config as any,
    mailService as any,
  );
  return {
    service,
    usersRepository,
    sessionsRepository,
    jwtService,
    mailService,
  };
};

const sha256 = (value: string): string =>
  createHash("sha256").update(value).digest("hex");

describe("AuthService", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    argon2.hash.mockResolvedValue("$argon2id$hashed");
    argon2.verify.mockResolvedValue(true);
  });

  describe("register", () => {
    it("creates the user, a session and returns tokens", async () => {
      const { service, usersRepository, sessionsRepository } = build();
      usersRepository.findOneBy.mockResolvedValue(null);

      const result = await service.register({
        name: "  Ana  ",
        email: "ANA@test.local",
        password: "Secreta123",
      } as any);

      expect(usersRepository.save).toHaveBeenCalledWith(
        expect.objectContaining({ email: "ana@test.local", name: "Ana" }),
      );
      expect(sessionsRepository.save).toHaveBeenCalled();
      expect(result.accessToken).toBe("access-token");
      expect(result.refreshToken).toContain(".");
      expect(result.user).not.toHaveProperty("passwordHash");
    });

    it("rejects a duplicated email", async () => {
      const { service, usersRepository } = build();
      usersRepository.findOneBy.mockResolvedValue(buildUser());

      await expect(
        service.register({
          name: "A",
          email: "ana@test.local",
          password: "Secreta123",
        } as any),
      ).rejects.toMatchObject({ response: { code: ErrorCode.EMAIL_IN_USE } });
    });
  });

  describe("login", () => {
    it("returns tokens for valid credentials", async () => {
      const { service, usersRepository } = build();
      usersRepository.findOneBy.mockResolvedValue(buildUser());

      const result = await service.login({
        email: "ana@test.local",
        password: "Secreta123",
      } as any);
      expect(result.accessToken).toBeDefined();
    });

    it("rejects unknown users and wrong passwords generically", async () => {
      const { service, usersRepository } = build();
      usersRepository.findOneBy.mockResolvedValue(null);
      await expect(
        service.login({ email: "x@test.local", password: "p" } as any),
      ).rejects.toMatchObject({
        response: { code: ErrorCode.INVALID_CREDENTIALS },
      });

      usersRepository.findOneBy.mockResolvedValue(buildUser());
      argon2.verify.mockResolvedValue(false);
      await expect(
        service.login({ email: "ana@test.local", password: "bad" } as any),
      ).rejects.toMatchObject({
        response: { code: ErrorCode.INVALID_CREDENTIALS },
      });
    });
  });

  describe("refresh", () => {
    const activeSession = (overrides: Record<string, unknown> = {}) => ({
      id: "s1",
      userId: "u1",
      refreshTokenHash: "$argon2id$hashed",
      expiresAt: new Date(Date.now() + 1000_000),
      revokedAt: null,
      ...overrides,
    });

    it("rotates a valid refresh token", async () => {
      const { service, sessionsRepository, usersRepository } = build();
      sessionsRepository.findOneBy.mockResolvedValue(activeSession());
      usersRepository.findOneBy.mockResolvedValue(buildUser());

      const result = await service.refresh("s1.secret");
      expect(result.accessToken).toBe("access-token");
      expect(sessionsRepository.save).toHaveBeenCalled();
    });

    it("rejects missing/malformed/unknown/revoked/expired tokens", async () => {
      const { service, sessionsRepository } = build();
      await expect(service.refresh(undefined)).rejects.toMatchObject({
        response: { code: ErrorCode.SESSION_REVOKED },
      });
      await expect(service.refresh("malformed")).rejects.toMatchObject({
        response: { code: ErrorCode.SESSION_REVOKED },
      });

      sessionsRepository.findOneBy.mockResolvedValue(null);
      await expect(service.refresh("s1.secret")).rejects.toMatchObject({
        response: { code: ErrorCode.SESSION_REVOKED },
      });

      sessionsRepository.findOneBy.mockResolvedValue(
        activeSession({ revokedAt: new Date() }),
      );
      await expect(service.refresh("s1.secret")).rejects.toMatchObject({
        response: { code: ErrorCode.SESSION_REVOKED },
      });

      sessionsRepository.findOneBy.mockResolvedValue(
        activeSession({ expiresAt: new Date(Date.now() - 1000) }),
      );
      await expect(service.refresh("s1.secret")).rejects.toMatchObject({
        response: { code: ErrorCode.SESSION_REVOKED },
      });
    });

    it("rejects when the token hash does not match", async () => {
      const { service, sessionsRepository } = build();
      sessionsRepository.findOneBy.mockResolvedValue(activeSession());
      argon2.verify.mockResolvedValue(false);
      await expect(service.refresh("s1.secret")).rejects.toMatchObject({
        response: { code: ErrorCode.SESSION_REVOKED },
      });
    });

    it("rejects when the user was deleted", async () => {
      const { service, sessionsRepository, usersRepository } = build();
      sessionsRepository.findOneBy.mockResolvedValue(activeSession());
      usersRepository.findOneBy.mockResolvedValue(null);
      await expect(service.refresh("s1.secret")).rejects.toMatchObject({
        response: { code: ErrorCode.SESSION_REVOKED },
      });
    });
  });

  it("revokes the session on logout", async () => {
    const { service, sessionsRepository } = build();
    await service.logout("u1", "s1");
    expect(sessionsRepository.update).toHaveBeenCalledWith(
      { id: "s1", userId: "u1" },
      { revokedAt: expect.any(Date) },
    );
  });

  it("returns the profile or throws when missing", async () => {
    const { service, usersRepository } = build();
    usersRepository.findOneBy.mockResolvedValue(buildUser());
    await expect(service.getMe("u1")).resolves.toMatchObject({
      email: "ana@test.local",
    });

    usersRepository.findOneBy.mockResolvedValue(null);
    await expect(service.getMe("u1")).rejects.toMatchObject({
      response: { code: ErrorCode.NOT_FOUND },
    });
  });

  describe("password recovery", () => {
    it("does nothing for unknown emails", async () => {
      const { service, usersRepository, mailService } = build();
      usersRepository.findOneBy.mockResolvedValue(null);
      await service.forgotPassword({ email: "nobody@test.local" } as any);
      expect(mailService.sendPasswordReset).not.toHaveBeenCalled();
    });

    it("stores a hashed token and sends the email", async () => {
      const { service, usersRepository, mailService } = build();
      usersRepository.findOneBy.mockResolvedValue(buildUser());

      await service.forgotPassword({ email: "ana@test.local" } as any);

      expect(usersRepository.save).toHaveBeenCalledWith(
        expect.objectContaining({
          resetTokenHash: sha256("reset-token"),
          resetTokenExpiresAt: expect.any(Date),
        }),
      );
      expect(mailService.sendPasswordReset).toHaveBeenCalledWith(
        "ana@test.local",
        "reset-token",
      );
    });

    it("resets the password, clearing the token and revoking sessions", async () => {
      const { service, usersRepository, sessionsRepository, jwtService } =
        build();
      jwtService.verifyAsync.mockResolvedValue({ sub: "u1", purpose: "reset" });
      usersRepository.findOneBy.mockResolvedValue(
        buildUser({
          resetTokenHash: sha256("valid-token"),
          resetTokenExpiresAt: new Date(Date.now() + 1000),
        }),
      );

      await service.resetPassword({
        token: "valid-token",
        password: "Nueva1234",
      } as any);

      expect(usersRepository.save).toHaveBeenCalledWith(
        expect.objectContaining({
          resetTokenHash: null,
          resetTokenExpiresAt: null,
        }),
      );
      expect(sessionsRepository.update).toHaveBeenCalledWith(
        { userId: "u1" },
        { revokedAt: expect.any(Date) },
      );
    });

    it("rejects invalid, mismatched, expired and wrong-purpose tokens", async () => {
      const { service, usersRepository, jwtService } = build();
      jwtService.verifyAsync.mockRejectedValue(new Error("bad"));
      await expect(
        service.resetPassword({ token: "x", password: "Nueva1234" } as any),
      ).rejects.toMatchObject({
        response: { code: ErrorCode.VALIDATION_ERROR },
      });

      jwtService.verifyAsync.mockResolvedValue({ sub: "u1", purpose: "other" });
      await expect(
        service.resetPassword({ token: "x", password: "Nueva1234" } as any),
      ).rejects.toMatchObject({
        response: { code: ErrorCode.VALIDATION_ERROR },
      });

      jwtService.verifyAsync.mockResolvedValue({ sub: "u1", purpose: "reset" });
      usersRepository.findOneBy.mockResolvedValue(null);
      await expect(
        service.resetPassword({ token: "x", password: "Nueva1234" } as any),
      ).rejects.toMatchObject({
        response: { code: ErrorCode.VALIDATION_ERROR },
      });

      usersRepository.findOneBy.mockResolvedValue(
        buildUser({ resetTokenHash: "other", resetTokenExpiresAt: new Date() }),
      );
      await expect(
        service.resetPassword({ token: "x", password: "Nueva1234" } as any),
      ).rejects.toMatchObject({
        response: { code: ErrorCode.VALIDATION_ERROR },
      });

      usersRepository.findOneBy.mockResolvedValue(
        buildUser({
          resetTokenHash: sha256("x"),
          resetTokenExpiresAt: new Date(Date.now() - 1000),
        }),
      );
      await expect(
        service.resetPassword({ token: "x", password: "Nueva1234" } as any),
      ).rejects.toMatchObject({
        response: { code: ErrorCode.VALIDATION_ERROR },
      });
    });
  });
});
