import { AccountTools } from "./account.tools";

const ACC = "00000000-0000-4000-8000-0000000000a1";

const build = () => {
  const account = {
    id: ACC,
    name: "Ahorro",
    type: "bank",
    currency: "ARS",
    initialBalance: 0,
    currentBalance: 100,
    archived: false,
  };
  const accounts = {
    listAccounts: jest.fn().mockResolvedValue([account]),
    getAccount: jest.fn().mockResolvedValue(account),
    createAccount: jest.fn().mockResolvedValue(account),
    updateAccount: jest.fn().mockResolvedValue({ ...account, name: "Nueva" }),
    archiveAccount: jest.fn().mockResolvedValue({ ...account, archived: true }),
    restoreAccount: jest
      .fn()
      .mockResolvedValue({ ...account, archived: false }),
  };
  const users = {
    getById: jest.fn().mockResolvedValue({ baseCurrency: "ARS" }),
  };
  const resolver = { resolveAccountId: jest.fn().mockResolvedValue(ACC) };

  const tools = new AccountTools(
    accounts as any,
    users as any,
    resolver as any,
  );
  const byName = (name: string) =>
    tools.definitions().find((definition) => definition.name === name)!;
  return { byName, accounts, resolver };
};

describe("AccountTools", () => {
  it("lists accounts", async () => {
    const { byName } = build();
    expect((await byName("listAccounts").execute!("u1", {})).summary).toContain(
      "1",
    );
  });

  it("defaults the currency to the user base currency", async () => {
    const { byName } = build();
    const prepared = await byName("createAccount").prepare!("u1", {
      name: "Ahorro",
      type: "bank",
    });
    expect(prepared.args.currency).toBe("ARS");
    expect(prepared.createdEntityName).toBe("Ahorro");
  });

  it("executes createAccount with the prepared arguments", async () => {
    const { byName, accounts } = build();
    const definition = byName("createAccount");
    const prepared = await definition.prepare!("u1", {
      name: "Ahorro",
      type: "bank",
      currency: "USD",
    });
    await definition.execute!("u1", prepared.args);
    expect(accounts.createAccount).toHaveBeenCalledWith(
      "u1",
      expect.objectContaining({ name: "Ahorro", currency: "USD" }),
    );
  });

  it("updates an account and rejects empty changes", async () => {
    const { byName, accounts } = build();
    const definition = byName("updateAccount");
    await definition.prepare!("u1", { accountId: ACC, name: "Nueva" });
    await expect(definition.prepare!("u1", { accountId: ACC })).rejects.toThrow(
      /ningún cambio/,
    );
    await definition.execute!("u1", { accountId: ACC, name: "Nueva" });
    expect(accounts.updateAccount).toHaveBeenCalled();
  });

  it("archives and restores an account", async () => {
    const { byName, accounts } = build();
    await byName("archiveAccount").prepare!("u1", { accountId: ACC });
    await byName("archiveAccount").execute!("u1", { accountId: ACC });
    await byName("restoreAccount").prepare!("u1", { accountId: ACC });
    await byName("restoreAccount").execute!("u1", { accountId: ACC });
    expect(accounts.archiveAccount).toHaveBeenCalledWith("u1", ACC);
    expect(accounts.restoreAccount).toHaveBeenCalledWith("u1", ACC);
  });
});
