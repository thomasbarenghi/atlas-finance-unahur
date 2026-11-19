import { ErrorCode } from "../common/errors/error-codes";
import { mockRepository } from "../../test/unit/mocks";
import { Account } from "./entities/account.entity";
import { AccountsService } from "./accounts.service";

const account = (overrides: Partial<Account> = {}): Account =>
  ({
    id: "a1",
    userId: "u1",
    name: "Caja",
    type: "cash",
    currency: "ARS",
    initialBalance: 1000,
    notes: null,
    createdAt: new Date("2026-01-01T00:00:00.000Z"),
    updatedAt: new Date("2026-01-01T00:00:00.000Z"),
    ...overrides,
  }) as Account;

const build = () => {
  const repository = mockRepository();
  repository.create.mockImplementation((value: any) => account(value));
  repository.save.mockImplementation(async (value: any) => account(value));
  const balances = {
    signedTotalsByAccount: jest.fn().mockResolvedValue(new Map([["a1", 50]])),
    currentBalanceOf: jest.fn().mockResolvedValue(1050),
    hasTransactions: jest.fn().mockResolvedValue(false),
  };
  const service = new AccountsService(repository as any, balances as any);
  return { service, repository, balances };
};

describe("AccountsService", () => {
  it("lists accounts with their computed current balance", async () => {
    const { service, repository } = build();
    repository.find.mockResolvedValue([account()]);

    const [result] = await service.listAccounts("u1");
    expect(result.currentBalance).toBe(1050);
  });

  it("lists owned entities", async () => {
    const { service, repository } = build();
    repository.find.mockResolvedValue([account()]);
    await expect(service.listOwnedAccounts("u1")).resolves.toHaveLength(1);
  });

  it("gets one account or throws when missing", async () => {
    const { service, repository } = build();
    repository.findOneBy.mockResolvedValue(account());
    await expect(service.getAccount("u1", "a1")).resolves.toMatchObject({
      currentBalance: 1050,
    });

    repository.findOneBy.mockResolvedValue(null);
    await expect(service.getAccount("u1", "nope")).rejects.toMatchObject({
      response: { code: ErrorCode.NOT_FOUND },
    });
  });

  it("creates an account defaulting the balance to 0", async () => {
    const { service } = build();
    const result = await service.createAccount("u1", {
      name: "  Caja  ",
      type: "cash",
      currency: "ARS",
    } as any);
    expect(result.initialBalance).toBe(0);
    expect(result.currentBalance).toBe(0);
    expect(result.currency).toBe("ARS");
  });

  it("allows changing the currency only when the account has no movements", async () => {
    const { service, repository, balances } = build();
    repository.findOneBy.mockResolvedValue(account({ currency: "ARS" }));

    balances.hasTransactions.mockResolvedValue(true);
    await expect(
      service.updateAccount("u1", "a1", { currency: "USD" } as any),
    ).rejects.toMatchObject({ response: { code: ErrorCode.VALIDATION_ERROR } });

    balances.hasTransactions.mockResolvedValue(false);
    const updated = await service.updateAccount("u1", "a1", {
      currency: "USD",
    } as any);
    expect(updated.currency).toBe("USD");
  });

  it("updates only the provided fields", async () => {
    const { service, repository } = build();
    repository.findOneBy.mockResolvedValue(account());

    const result = await service.updateAccount("u1", "a1", {
      name: "  Nueva  ",
      initialBalance: 500,
      notes: "  hola  ",
    } as any);

    expect(result.name).toBe("Nueva");
    expect(result.initialBalance).toBe(500);
    expect(result.notes).toBe("hola");
  });

  it("deletes an owned account", async () => {
    const { service, repository } = build();
    repository.findOneBy.mockResolvedValue(account());

    await service.deleteAccount("u1", "a1");

    expect(repository.remove).toHaveBeenCalledWith(account());
  });

  it("rejects deleting an account that is not owned", async () => {
    const { service, repository } = build();
    repository.findOneBy.mockResolvedValue(null);

    await expect(service.deleteAccount("u1", "nope")).rejects.toMatchObject({
      response: { code: ErrorCode.NOT_FOUND },
    });
  });

  it("asserts ownership through a single lookup", async () => {
    const { service, repository } = build();
    repository.findOneBy.mockResolvedValue(account());

    await expect(service.assertAccountOwned("u1", "a1")).resolves.toMatchObject(
      {
        id: "a1",
      },
    );
  });
});
