import { ErrorCode } from "../common/errors/error-codes";
import { TransactionsOrchestrator } from "./transactions.orchestrator";

const build = () => {
  const transactionsService = {
    createTransaction: jest.fn(async (_u: string, dto: unknown) => dto),
    updateTransaction: jest.fn(
      async (_u: string, _i: string, dto: unknown) => dto,
    ),
    getTransaction: jest.fn(),
  };
  const accountsService = {
    assertAccountUsable: jest.fn(async (_u: string, id: string) => ({
      id,
      currency: "ARS",
      archived: false,
    })),
  };
  const categoriesService = {
    assertCategoryUsable: jest.fn(async () => ({ id: "c1", type: "expense" })),
  };
  const orchestrator = new TransactionsOrchestrator(
    transactionsService as any,
    accountsService as any,
    categoriesService as any,
  );
  return {
    orchestrator,
    transactionsService,
    accountsService,
    categoriesService,
  };
};

const dto = (overrides: Record<string, unknown> = {}) => ({
  type: "expense",
  amount: 100,
  currency: "ARS",
  date: "2026-03-10",
  description: "x",
  accountId: "a1",
  categoryId: "c1",
  ...overrides,
});

describe("TransactionsOrchestrator", () => {
  it("validates the account and category, then delegates creation", async () => {
    const {
      orchestrator,
      accountsService,
      categoriesService,
      transactionsService,
    } = build();

    await orchestrator.createTransaction("u1", dto() as any);

    expect(accountsService.assertAccountUsable).toHaveBeenCalledWith(
      "u1",
      "a1",
    );
    expect(categoriesService.assertCategoryUsable).toHaveBeenCalledWith(
      "u1",
      "c1",
    );
    expect(transactionsService.createTransaction).toHaveBeenCalled();
  });

  it("rejects a currency mismatch", async () => {
    const { orchestrator, accountsService } = build();
    accountsService.assertAccountUsable.mockResolvedValue({
      id: "a1",
      currency: "USD",
      archived: false,
    });

    await expect(
      orchestrator.createTransaction("u1", dto({ currency: "ARS" }) as any),
    ).rejects.toMatchObject({ response: { code: ErrorCode.VALIDATION_ERROR } });
  });

  it("validates both legs of a transfer", async () => {
    const { orchestrator, accountsService } = build();

    await orchestrator.createTransaction(
      "u1",
      dto({
        type: "transfer",
        categoryId: null,
        transferAccountId: "a2",
      }) as any,
    );
    expect(accountsService.assertAccountUsable).toHaveBeenCalledWith(
      "u1",
      "a2",
    );
  });

  it("rejects a transfer without destination or with equal accounts", async () => {
    const { orchestrator } = build();

    await expect(
      orchestrator.createTransaction(
        "u1",
        dto({ type: "transfer", categoryId: null }) as any,
      ),
    ).rejects.toMatchObject({ response: { code: ErrorCode.VALIDATION_ERROR } });

    await expect(
      orchestrator.createTransaction(
        "u1",
        dto({
          type: "transfer",
          categoryId: null,
          transferAccountId: "a1",
        }) as any,
      ),
    ).rejects.toMatchObject({ response: { code: ErrorCode.VALIDATION_ERROR } });
  });

  it("validates the currency of both transfer accounts", async () => {
    const { orchestrator, accountsService } = build();
    accountsService.assertAccountUsable
      .mockResolvedValueOnce({ id: "a1", currency: "ARS", archived: false })
      .mockResolvedValueOnce({ id: "a2", currency: "USD", archived: false });

    await expect(
      orchestrator.createTransaction(
        "u1",
        dto({
          type: "transfer",
          categoryId: null,
          transferAccountId: "a2",
        }) as any,
      ),
    ).rejects.toMatchObject({ response: { code: ErrorCode.VALIDATION_ERROR } });
  });

  it("updates a plain transaction validating account/category", async () => {
    const {
      orchestrator,
      accountsService,
      categoriesService,
      transactionsService,
    } = build();
    transactionsService.getTransaction.mockResolvedValue({
      id: "t1",
      type: "expense",
      accountId: "a1",
      transferAccountId: null,
      currency: "ARS",
    });

    await orchestrator.updateTransaction("u1", "t1", {
      accountId: "a2",
      categoryId: "c9",
    } as any);

    expect(accountsService.assertAccountUsable).toHaveBeenCalledWith(
      "u1",
      "a2",
    );
    expect(categoriesService.assertCategoryUsable).toHaveBeenCalledWith(
      "u1",
      "c9",
    );
  });

  it("validates the existing account when only the currency changes", async () => {
    const { orchestrator, accountsService, transactionsService } = build();
    transactionsService.getTransaction.mockResolvedValue({
      id: "t1",
      type: "expense",
      accountId: "a1",
      transferAccountId: null,
      currency: "ARS",
    });
    accountsService.assertAccountUsable.mockResolvedValue({
      id: "a1",
      currency: "USD",
      archived: false,
    });

    await orchestrator.updateTransaction("u1", "t1", {
      currency: "USD",
    } as any);
    expect(accountsService.assertAccountUsable).toHaveBeenCalledWith(
      "u1",
      "a1",
    );
  });

  it("validates both legs when updating a transfer", async () => {
    const { orchestrator, accountsService, transactionsService } = build();
    transactionsService.getTransaction.mockResolvedValue({
      id: "t1",
      type: "transfer",
      accountId: "a1",
      transferAccountId: "a2",
      currency: "ARS",
    });

    await orchestrator.updateTransaction("u1", "t1", {
      accountId: "a3",
      transferAccountId: "a4",
    } as any);
    expect(accountsService.assertAccountUsable).toHaveBeenCalledWith(
      "u1",
      "a3",
    );
    expect(accountsService.assertAccountUsable).toHaveBeenCalledWith(
      "u1",
      "a4",
    );
  });

  it("rejects an invalid transfer update", async () => {
    const { orchestrator, transactionsService } = build();
    transactionsService.getTransaction.mockResolvedValue({
      id: "t1",
      type: "transfer",
      accountId: "a1",
      transferAccountId: "a2",
      currency: "ARS",
    });

    await expect(
      orchestrator.updateTransaction("u1", "t1", {
        accountId: "a3",
        transferAccountId: "a3",
      } as any),
    ).rejects.toMatchObject({ response: { code: ErrorCode.VALIDATION_ERROR } });

    transactionsService.getTransaction.mockResolvedValue({
      id: "t1",
      type: "transfer",
      accountId: "a1",
      transferAccountId: null,
      currency: "ARS",
    });
    await expect(
      orchestrator.updateTransaction("u1", "t1", { amount: 1 } as any),
    ).rejects.toMatchObject({ response: { code: ErrorCode.VALIDATION_ERROR } });
  });
});
