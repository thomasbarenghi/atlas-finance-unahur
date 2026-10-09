import { ErrorCode } from "../common/errors/error-codes";
import { mockRepository } from "../../test/unit/mocks";
import { User } from "./entities/user.entity";
import { UsersService } from "./users.service";

const user = (overrides: Partial<User> = {}): User =>
  ({
    id: "u1",
    name: "Ana",
    email: "ana@test.local",
    passwordHash: "hash",
    baseCurrency: "ARS",
    theme: "system",
    aiEnabled: false,
    assistantDestructiveEnabled: false,
    approvalStatus: "approved",
    createdAt: new Date("2026-01-01T00:00:00.000Z"),
    ...overrides,
  }) as User;

const build = () => {
  const repository = mockRepository();
  repository.save.mockImplementation(async (value: any) => user(value));
  const config = {
    get: jest.fn(() => ["ARS", "USD", "EUR", "BRL", "UYU"]),
  };
  const service = new UsersService(repository as any, config as any);
  return { service, repository };
};

describe("UsersService", () => {
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

  it("finds a user by lowercased email", async () => {
    const { service, repository } = build();
    repository.findOneBy.mockResolvedValue(user());
    await service.findByEmail("ANA@test.local");
    expect(repository.findOneBy).toHaveBeenCalledWith({
      email: "ana@test.local",
    });

    repository.findOneBy.mockResolvedValue(null);
    await expect(service.findByEmail("x@test.local")).resolves.toBeNull();
  });

  it("updates preferences and normalizes the base currency", async () => {
    const { service, repository } = build();
    repository.findOneBy.mockResolvedValue(user());

    const result = await service.updateMe("u1", {
      name: "  Ana Maria  ",
      baseCurrency: "usd",
      theme: "dark",
      aiEnabled: true,
      assistantDestructiveEnabled: true,
    } as any);

    expect(result).toMatchObject({
      name: "Ana Maria",
      baseCurrency: "USD",
      theme: "dark",
      aiEnabled: true,
      assistantDestructiveEnabled: true,
    });
  });

  it("rejects an unsupported base currency", async () => {
    const { service, repository } = build();
    repository.findOneBy.mockResolvedValue(user());
    await expect(
      service.updateMe("u1", { baseCurrency: "GBP" } as any),
    ).rejects.toMatchObject({ response: { code: ErrorCode.VALIDATION_ERROR } });
  });
});
