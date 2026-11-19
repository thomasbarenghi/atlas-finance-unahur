import * as argon2 from "argon2";
import { ErrorCode } from "../common/errors/error-codes";
import { mockRepository } from "../../test/unit/mocks";
import { User } from "./entities/user.entity";
import { UsersService } from "./users.service";

jest.mock("argon2", () => ({
  hash: jest.fn(async () => "new-hash"),
  verify: jest.fn(async () => true),
}));

const mockedArgon2 = argon2 as jest.Mocked<typeof argon2>;

const user = (overrides: Partial<User> = {}): User =>
  ({
    id: "u1",
    name: "Ana",
    email: "ana@test.local",
    passwordHash: "old-hash",
    createdAt: new Date("2026-01-01T00:00:00.000Z"),
    ...overrides,
  }) as User;

const build = () => {
  const repository = mockRepository();
  repository.save.mockImplementation(async (value: any) => user(value));
  const service = new UsersService(repository as any);
  return { service, repository };
};

describe("UsersService", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockedArgon2.verify.mockResolvedValue(true);
    mockedArgon2.hash.mockResolvedValue("new-hash");
  });

  it("returns the profile by id", async () => {
    const { service, repository } = build();
    repository.findOneBy.mockResolvedValue(user());
    await expect(service.getById("u1")).resolves.toMatchObject({
      email: "ana@test.local",
    });
  });

  it("throws when the user does not exist", async () => {
    const { service, repository } = build();
    repository.findOneBy.mockResolvedValue(null);
    await expect(service.getById("u1")).rejects.toMatchObject({
      response: { code: ErrorCode.NOT_FOUND },
    });
  });

  it("finds a user by normalized email", async () => {
    const { service, repository } = build();
    repository.findOneBy.mockResolvedValue(user());
    await service.findByEmail(" ANA@test.local ");

    expect(repository.findOneBy).toHaveBeenCalledWith({
      email: "ana@test.local",
    });

    repository.findOneBy.mockResolvedValue(null);
    await expect(service.findByEmail("x@test.local")).resolves.toBeNull();
  });

  it("updates the profile name", async () => {
    const { service, repository } = build();
    repository.findOneBy.mockResolvedValue(user());

    const result = await service.updateMe("u1", { name: "  Ana Maria  " });

    expect(result).toMatchObject({ name: "Ana Maria" });
  });

  it("updates and normalizes the email", async () => {
    const { service, repository } = build();
    repository.findOneBy
      .mockResolvedValueOnce(user())
      .mockResolvedValueOnce(null);

    const result = await service.updateMe("u1", {
      email: "  ANA.NUEVA@TEST.LOCAL ",
    });

    expect(repository.save).toHaveBeenCalledWith(
      expect.objectContaining({ email: "ana.nueva@test.local" }),
    );
    expect(result.email).toBe("ana.nueva@test.local");
  });

  it("rejects an email already used by another user", async () => {
    const { service, repository } = build();
    repository.findOneBy
      .mockResolvedValueOnce(user())
      .mockResolvedValueOnce(user({ id: "u2", email: "otra@test.local" }));

    await expect(
      service.updateMe("u1", { email: "otra@test.local" }),
    ).rejects.toMatchObject({
      response: {
        code: ErrorCode.EMAIL_IN_USE,
        fieldErrors: { email: ["Ese email ya está registrado"] },
      },
    });
    expect(repository.save).not.toHaveBeenCalled();
  });

  it("changes the password after verifying the current one", async () => {
    const { service, repository } = build();
    repository.findOneBy.mockResolvedValue(user());

    await service.changePassword("u1", {
      currentPassword: "Secreta123",
      newPassword: "Nueva123",
    });

    expect(mockedArgon2.verify).toHaveBeenCalledWith("old-hash", "Secreta123");
    expect(mockedArgon2.hash).toHaveBeenCalledWith("Nueva123");
    expect(repository.save).toHaveBeenCalledWith(
      expect.objectContaining({ passwordHash: "new-hash" }),
    );
  });

  it("rejects a password change when the current password is wrong", async () => {
    const { service, repository } = build();
    repository.findOneBy.mockResolvedValue(user());
    mockedArgon2.verify.mockResolvedValue(false);

    await expect(
      service.changePassword("u1", {
        currentPassword: "incorrecta",
        newPassword: "Nueva123",
      }),
    ).rejects.toMatchObject({
      response: {
        code: ErrorCode.VALIDATION_ERROR,
        fieldErrors: {
          currentPassword: ["La contraseña actual no es correcta"],
        },
      },
    });

    expect(mockedArgon2.hash).not.toHaveBeenCalled();
    expect(repository.save).not.toHaveBeenCalled();
  });
});
