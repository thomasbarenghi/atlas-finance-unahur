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
    assertAccountOwned: jest.fn(async (_u: string, id: string) => ({ id })),
  };
  const categoriesService = {
    assertCategoryExists: jest.fn(async () => ({ id: "c1", type: "expense" })),
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

    expect(accountsService.assertAccountOwned).toHaveBeenCalledWith("u1", "a1");
    expect(categoriesService.assertCategoryExists).toHaveBeenCalledWith("c1");
    expect(transactionsService.createTransaction).toHaveBeenCalled();
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
    expect(accountsService.assertAccountOwned).toHaveBeenCalledWith("u1", "a2");
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
    });

    await orchestrator.updateTransaction("u1", "t1", {
      accountId: "a2",
      categoryId: "c9",
    } as any);

    expect(accountsService.assertAccountOwned).toHaveBeenCalledWith("u1", "a2");
    expect(categoriesService.assertCategoryExists).toHaveBeenCalledWith("c9");
  });

  it("validates both legs when updating a transfer", async () => {
    const { orchestrator, accountsService, transactionsService } = build();
    transactionsService.getTransaction.mockResolvedValue({
      id: "t1",
      type: "transfer",
      accountId: "a1",
      transferAccountId: "a2",
    });

    await orchestrator.updateTransaction("u1", "t1", {
      accountId: "a3",
      transferAccountId: "a4",
    } as any);
    expect(accountsService.assertAccountOwned).toHaveBeenCalledWith("u1", "a3");
    expect(accountsService.assertAccountOwned).toHaveBeenCalledWith("u1", "a4");
  });

  it("rejects an invalid transfer update", async () => {
    const { orchestrator, transactionsService } = build();
    transactionsService.getTransaction.mockResolvedValue({
      id: "t1",
      type: "transfer",
      accountId: "a1",
      transferAccountId: "a2",
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
    });
    await expect(
      orchestrator.updateTransaction("u1", "t1", { amount: 1 } as any),
    ).rejects.toMatchObject({ response: { code: ErrorCode.VALIDATION_ERROR } });
  });
});
