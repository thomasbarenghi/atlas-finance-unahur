import { ErrorCode } from "../common/errors/error-codes";
import { User } from "../users/entities/user.entity";
import { AdminService } from "./admin.service";

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
    approvalStatus: "pending",
    resetTokenHash: null,
    resetTokenExpiresAt: null,
    createdAt: new Date("2026-01-01T00:00:00.000Z"),
    updatedAt: new Date("2026-01-01T00:00:00.000Z"),
    ...overrides,
  }) as User;

const build = () => {
  const usersRepository = {
    find: jest.fn(),
    findOneBy: jest.fn(),
    save: jest.fn(async (value: User) => value),
  };
  const service = new AdminService(usersRepository as any);
  return { service, usersRepository };
};

describe("AdminService", () => {
  it("lists users, optionally filtered by approval status", async () => {
    const { service, usersRepository } = build();
    usersRepository.find.mockResolvedValue([user()]);

    await expect(service.listUsers("pending")).resolves.toEqual([
      expect.objectContaining({ id: "u1", approvalStatus: "pending" }),
    ]);
    expect(usersRepository.find).toHaveBeenCalledWith({
      where: { approvalStatus: "pending" },
      order: { createdAt: "DESC" },
    });

    await service.listUsers();
    expect(usersRepository.find).toHaveBeenLastCalledWith({
      where: {},
      order: { createdAt: "DESC" },
    });
  });

  it("approves and rejects a user", async () => {
    const { service, usersRepository } = build();
    usersRepository.findOneBy.mockResolvedValue(
      user({ approvalStatus: "pending" }),
    );

    await expect(service.approve("u1")).resolves.toMatchObject({
      approvalStatus: "approved",
    });
    await expect(service.reject("u1")).resolves.toMatchObject({
      approvalStatus: "rejected",
    });
    expect(usersRepository.save).toHaveBeenCalledTimes(2);
  });

  it("throws when the user does not exist", async () => {
    const { service, usersRepository } = build();
    usersRepository.findOneBy.mockResolvedValue(null);

    await expect(service.approve("missing")).rejects.toMatchObject({
      response: { code: ErrorCode.NOT_FOUND },
    });
  });
});
