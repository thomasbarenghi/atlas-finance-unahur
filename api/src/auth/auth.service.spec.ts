import * as argon2 from "argon2";
import { ErrorCode } from "../common/errors/error-codes";
import { mockRepository } from "../../test/unit/mocks";
import { User } from "../users/entities/user.entity";
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
    primaryCurrency: "ARS",
    createdAt: new Date("2026-01-01T00:00:00.000Z"),
    ...overrides,
  }) as User;

const build = () => {
  const usersRepository = mockRepository();
  usersRepository.create.mockImplementation((value: any) => ({
    ...user(),
    ...value,
  }));
  usersRepository.save.mockImplementation(async (value: any) => value);

  const jwtService = {
    sign: jest.fn((payload: { type?: string }) =>
      payload.type === "refresh" ? "refresh-token" : "access-token",
    ),
    verifyAsync: jest.fn(),
  };
  const config = {
    get: jest.fn((key: string) => {
      if (key === "jwt") return { refreshTtlDays: 30 };
      if (key === "defaultCurrency") return "ARS";
      return undefined;
    }),
  };

  const service = new AuthService(
    usersRepository as any,
    jwtService as any,
    config as any,
  );
  return { service, usersRepository, jwtService };
};

describe("AuthService", () => {
  beforeEach(() => jest.clearAllMocks());

  it("registers a user, hashing the password and issuing tokens", async () => {
    const { service, usersRepository, jwtService } = build();
    usersRepository.findOneBy.mockResolvedValue(null);

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
    expect(result.tokens).toEqual({
      accessToken: "access-token",
      refreshToken: "refresh-token",
    });
    expect(jwtService.sign).toHaveBeenCalledWith(
      expect.objectContaining({ type: "access" }),
    );
    expect(jwtService.sign).toHaveBeenCalledWith(
      expect.objectContaining({ type: "refresh" }),
      { expiresIn: 30 * 86_400 },
    );
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
    ).resolves.toMatchObject({
      tokens: {
        accessToken: "access-token",
        refreshToken: "refresh-token",
      },
    });
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

  it("renews both tokens from a valid stateless refresh token", async () => {
    const { service, usersRepository, jwtService } = build();
    jwtService.verifyAsync.mockResolvedValue({
      sub: "u1",
      email: "ana@test.local",
      type: "refresh",
    });
    usersRepository.findOneBy.mockResolvedValue(user());

    await expect(service.refresh("refresh-token")).resolves.toEqual({
      accessToken: "access-token",
      refreshToken: "refresh-token",
    });
    expect(jwtService.verifyAsync).toHaveBeenCalledWith("refresh-token");
    expect(mockedArgon2.verify).not.toHaveBeenCalled();
  });

  it("rejects an invalid or missing refresh token", async () => {
    const { service, jwtService } = build();

    await expect(service.refresh(undefined)).rejects.toMatchObject({
      response: { code: ErrorCode.SESSION_REVOKED },
    });

    jwtService.verifyAsync.mockRejectedValue(new Error("invalid token"));
    await expect(service.refresh("invalid")).rejects.toMatchObject({
      response: { code: ErrorCode.SESSION_REVOKED },
    });
  });

  it("rejects an access token used as a refresh token", async () => {
    const { service, jwtService } = build();
    jwtService.verifyAsync.mockResolvedValue({
      sub: "u1",
      email: "ana@test.local",
      type: "access",
    });

    await expect(service.refresh("access-token")).rejects.toMatchObject({
      response: { code: ErrorCode.SESSION_REVOKED },
    });
  });

  it("rejects a refresh token whose user no longer exists", async () => {
    const { service, usersRepository, jwtService } = build();
    jwtService.verifyAsync.mockResolvedValue({
      sub: "u1",
      email: "ana@test.local",
      type: "refresh",
    });
    usersRepository.findOneBy.mockResolvedValue(null);

    await expect(service.refresh("refresh-token")).rejects.toMatchObject({
      response: { code: ErrorCode.SESSION_REVOKED },
    });
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
