import { TransactionTools } from "./transaction.tools";

const ACC = "00000000-0000-4000-8000-00000000000a";
const ACC2 = "00000000-0000-4000-8000-00000000000b";
const CAT = "00000000-0000-4000-8000-00000000000c";

const transaction = (overrides: Record<string, unknown> = {}) => ({
  id: "t1",
  type: "expense",
  amount: 100,
  currency: "ARS",
  date: "2026-03-10",
  description: "Compra",
  notes: null,
  accountId: ACC,
  categoryId: CAT,
  transferGroupId: null,
  ...overrides,
});

const build = () => {
  const transactions = {
    listTransactions: jest
      .fn()
      .mockResolvedValue({ total: 1, items: [transaction()] }),
    getTransaction: jest.fn().mockResolvedValue(transaction()),
    deleteTransaction: jest.fn(),
  };
  const transactionsOrchestrator = {
    createTransaction: jest.fn().mockResolvedValue(transaction()),
    updateTransaction: jest
      .fn()
      .mockResolvedValue(transaction({ description: "Editada" })),
  };
  const accounts = {
    getAccount: jest
      .fn()
      .mockResolvedValue({ id: ACC, name: "Caja", currency: "ARS" }),
  };
  const categories = {
    assertCategoryUsable: jest
      .fn()
      .mockResolvedValue({ id: CAT, name: "Comida" }),
  };
  const resolver = {
    resolveAccountId: jest.fn().mockResolvedValue(ACC),
    resolveCategoryId: jest.fn().mockResolvedValue(CAT),
  };
  const tools = new TransactionTools(
    transactions as any,
    transactionsOrchestrator as any,
    accounts as any,
    categories as any,
    resolver as any,
  );
  const byName = (name: string) =>
    tools.definitions().find((definition) => definition.name === name)!;
  return { byName, transactions, transactionsOrchestrator, accounts, resolver };
};

describe("TransactionTools", () => {
  it("lists transactions resolving account and category filters", async () => {
    const { byName, transactions, resolver } = build();
    await byName("listTransactions").execute!("u1", {
      account: "Caja",
      category: "food",
      type: "expense",
    });
    expect(resolver.resolveAccountId).toHaveBeenCalledWith("u1", "Caja");
    expect(resolver.resolveCategoryId).toHaveBeenCalledWith("u1", "food");
    expect(transactions.listTransactions).toHaveBeenCalled();
  });

  it("lists transactions without account/category filters", async () => {
    const { byName, resolver } = build();
    await byName("listTransactions").execute!("u1", {});
    expect(resolver.resolveAccountId).not.toHaveBeenCalled();
    expect(resolver.resolveCategoryId).not.toHaveBeenCalled();
  });

  it("rejects an expense without a category", async () => {
    const { byName } = build();
    await expect(
      byName("createTransaction").prepare!("u1", {
        type: "expense",
        amount: 50,
        date: "2026-03-10",
        description: "Varios",
        account: "Caja",
        currency: "USD",
      }),
    ).rejects.toMatchObject({
      response: {
        code: "VALIDATION_ERROR",
        fieldErrors: { categoryId: expect.any(Array) },
      },
    });
  });

  it("creates an expense with a category and an explicit currency", async () => {
    const { byName } = build();
    const prepared = await byName("createTransaction").prepare!("u1", {
      type: "expense",
      amount: 50,
      date: "2026-03-10",
      description: "Varios",
      account: "Caja",
      category: "Comida",
      currency: "USD",
    });
    expect(prepared.args).toMatchObject({ categoryId: CAT, currency: "USD" });
  });

  it("updates resolving account and category", async () => {
    const { byName, resolver } = build();
    await byName("updateTransaction").execute!("u1", {
      transactionId: "t1",
      account: "Banco",
      category: "food",
    });
    expect(resolver.resolveAccountId).toHaveBeenCalledWith("u1", "Banco");
    expect(resolver.resolveCategoryId).toHaveBeenCalledWith("u1", "food");
  });

  it("creates an income defaulting the currency to the account", async () => {
    const { byName, transactionsOrchestrator } = build();
    const definition = byName("createTransaction");

    const prepared = await definition.prepare!("u1", {
      type: "income",
      amount: 500,
      date: "2026-03-05",
      description: "Sueldo",
      account: "Caja",
      category: "salary",
    });
    expect(prepared.args).toMatchObject({ currency: "ARS", type: "income" });

    await definition.execute!("u1", prepared.args);
    expect(transactionsOrchestrator.createTransaction).toHaveBeenCalled();
  });

  it("rejects an invalid transaction type on prepare", async () => {
    const { byName } = build();
    await expect(
      byName("createTransaction").prepare!("u1", {
        type: "transfer",
        amount: 10,
        date: "2026-03-05",
        description: "x",
        account: "Caja",
      }),
    ).rejects.toMatchObject({ response: { code: "VALIDATION_ERROR" } });
  });

  it("prepares and executes a transfer", async () => {
    const { byName, accounts } = build();
    accounts.getAccount
      .mockResolvedValueOnce({ id: ACC, name: "Caja", currency: "ARS" })
      .mockResolvedValueOnce({ id: ACC2, name: "Banco", currency: "ARS" });
    const definition = byName("transferBetweenAccounts");

    const prepared = await definition.prepare!("u1", {
      amount: 100,
      date: "2026-03-10",
      description: "Ahorro",
      fromAccount: "Caja",
      toAccount: "Banco",
    });
    expect(prepared.args).toMatchObject({
      type: "transfer",
      transferAccountId: ACC,
    });

    await definition.execute!("u1", prepared.args);
  });

  it("updates a transaction and rejects empty changes / missing id", async () => {
    const { byName, transactionsOrchestrator } = build();
    const definition = byName("updateTransaction");

    await definition.prepare!("u1", { transactionId: "t1", amount: 200 });
    await expect(
      definition.prepare!("u1", { transactionId: "t1" }),
    ).rejects.toMatchObject({ response: { code: "VALIDATION_ERROR" } });
    await expect(definition.prepare!("u1", {})).rejects.toThrow(/Falta/);

    await definition.execute!("u1", { transactionId: "t1", amount: 200 });
    expect(transactionsOrchestrator.updateTransaction).toHaveBeenCalled();
  });

  it("prepares delete including transfer impact and executes it", async () => {
    const { byName, transactions } = build();
    const definition = byName("deleteTransaction");

    const prepared = await definition.prepare!("u1", { transactionId: "t1" });
    expect(prepared.preview.impact).toBeUndefined();

    transactions.getTransaction.mockResolvedValue(
      transaction({ transferGroupId: "g1" }),
    );
    const transfer = await definition.prepare!("u1", { transactionId: "t1" });
    expect(transfer.preview.impact).toContain("dos lados");

    await definition.execute!("u1", { transactionId: "t1" });
    expect(transactions.deleteTransaction).toHaveBeenCalledWith("u1", "t1");
  });
});
