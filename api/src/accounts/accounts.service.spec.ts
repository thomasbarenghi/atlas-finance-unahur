import { ErrorCode } from "../common/errors/error-codes";
import { mockCurrency, mockRepository } from "../../test/unit/mocks";
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
    archived: false,
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
  };
  const service = new AccountsService(
    repository as any,
    balances as any,
    mockCurrency() as any,
  );
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
      currency: "ars",
    } as any);
    expect(result.initialBalance).toBe(0);
    expect(result.currency).toBe("ARS");
    expect(result.currentBalance).toBe(0);
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

  it("archives and restores an account", async () => {
    const { service, repository } = build();
    repository.findOneBy.mockResolvedValue(account());

    expect((await service.archiveAccount("u1", "a1")).archived).toBe(true);
    expect((await service.restoreAccount("u1", "a1")).archived).toBe(false);
  });

  it("asserts usability and rejects archived accounts", async () => {
    const { service, repository } = build();
    repository.findOneBy.mockResolvedValue(account({ archived: true }));
    await expect(service.assertAccountUsable("u1", "a1")).rejects.toMatchObject(
      {
        response: { code: ErrorCode.ACCOUNT_ARCHIVED },
      },
    );

    repository.findOneBy.mockResolvedValue(account());
    await expect(
      service.assertAccountUsable("u1", "a1"),
    ).resolves.toBeDefined();
  });

  it("stores notes on create and updates the currency", async () => {
    const { service, repository } = build();
    await service.createAccount("u1", {
      name: "C",
      type: "cash",
      currency: "ARS",
      notes: "n",
    } as any);

    repository.findOneBy.mockResolvedValue(account());
    const updated = await service.updateAccount("u1", "a1", {
      currency: "usd",
      notes: null,
    } as any);
    expect(updated).toMatchObject({ currency: "USD", notes: null });
  });
});
