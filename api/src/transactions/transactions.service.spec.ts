import { ErrorCode } from "../common/errors/error-codes";
import { mockDataSource, mockRepository } from "../../test/unit/mocks";
import { CreateTransactionDto } from "./dto/create-transaction.dto";
import { Transaction } from "./entities/transaction.entity";
import { TransactionsService } from "./transactions.service";

const build = () => {
  const repository = mockRepository();
  repository.findAndCount = jest.fn().mockResolvedValue([[], 0]);
  repository.create.mockImplementation((value: any) => ({
    id: "t1",
    createdAt: new Date("2026-03-10T00:00:00.000Z"),
    updatedAt: new Date("2026-03-10T00:00:00.000Z"),
    ...value,
  }));
  repository.save.mockImplementation(async (value: any) => ({
    id: value.id ?? "t1",
    createdAt: value.createdAt ?? new Date("2026-03-10T00:00:00.000Z"),
    updatedAt: value.updatedAt ?? new Date("2026-03-10T00:00:00.000Z"),
    ...value,
  }));
  const dataSource = mockDataSource();
  const service = new TransactionsService(repository as any, dataSource as any);
  return { service, repository, dataSource };
};

const tx = (overrides: Partial<Transaction> = {}): Transaction =>
  ({
    id: "t1",
    userId: "u1",
    type: "expense",
    amount: 100,
    date: "2026-03-10",
    description: "x",
    notes: null,
    accountId: "a1",
    transferAccountId: null,
    categoryId: "c1",
    transferGroupId: null,
    createdAt: new Date("2026-03-10T00:00:00.000Z"),
    updatedAt: new Date("2026-03-10T00:00:00.000Z"),
    ...overrides,
  }) as Transaction;

const baseDto = (
  overrides: Partial<CreateTransactionDto> = {},
): CreateTransactionDto =>
  ({
    type: "expense",
    amount: 100,
    date: "2026-03-10",
    description: "Compra",
    accountId: "a1",
    categoryId: "c1",
    ...overrides,
  }) as CreateTransactionDto;

describe("TransactionsService", () => {
  it("lists transactions with pagination", async () => {
    const { service, repository } = build();
    repository.findAndCount.mockResolvedValue([[tx()], 1]);

    const result = await service.listTransactions("u1", {
      page: 2,
      pageSize: 5,
    });

    expect(repository.findAndCount).toHaveBeenCalledWith(
      expect.objectContaining({ where: { userId: "u1" }, skip: 5, take: 5 }),
    );
    expect(result).toMatchObject({
      page: 2,
      pageSize: 5,
      total: 1,
      totalPages: 1,
    });
    expect(result.items[0].id).toBe("t1");
  });

  it("returns an empty paginated result when there is nothing", async () => {
    const { service, repository } = build();
    repository.findAndCount.mockResolvedValue([[], 0]);

    const result = await service.listTransactions("u1", {} as any);
    expect(result.items).toEqual([]);
    expect(result.totalPages).toBe(1);
  });

  it("lists all owned transactions", async () => {
    const { service, repository } = build();
    repository.find.mockResolvedValue([tx()]);
    await expect(service.listOwnedTransactions("u1")).resolves.toHaveLength(1);
  });

  it("gets a transaction by id", async () => {
    const { service, repository } = build();
    repository.findOneBy.mockResolvedValue(tx());
    const result = await service.getTransaction("u1", "t1");
    expect(result.id).toBe("t1");
  });

  it("throws NOT_FOUND when the transaction does not exist", async () => {
    const { service, repository } = build();
    repository.findOneBy.mockResolvedValue(null);
    await expect(service.getTransaction("u1", "nope")).rejects.toMatchObject({
      response: { code: ErrorCode.NOT_FOUND },
    });
  });

  it("creates an income/expense normalizing the amount and text", async () => {
    const { service, repository } = build();
    const result = await service.createTransaction(
      "u1",
      baseDto({ amount: -50, description: "  comida  ", notes: "  ok  " }),
    );
    expect(repository.create).toHaveBeenCalledWith(
      expect.objectContaining({
        amount: 50,
        description: "comida",
        notes: "ok",
        transferGroupId: null,
      }),
    );
    expect(result.amount).toBe(50);
  });

  it("requires a category for income/expense", async () => {
    const { service } = build();
    await expect(
      service.createTransaction("u1", baseDto({ categoryId: null })),
    ).rejects.toMatchObject({ response: { code: ErrorCode.VALIDATION_ERROR } });
  });

  it("creates both legs of a transfer atomically", async () => {
    const { service, dataSource } = build();
    const save = jest.fn(async (entity: any) => entity);
    dataSource.transaction.mockImplementation(async (cb: any) => cb({ save }));

    const result = await service.createTransaction(
      "u1",
      baseDto({
        type: "transfer",
        accountId: "a1",
        transferAccountId: "a2",
        categoryId: null,
      }),
    );

    expect(save).toHaveBeenCalledTimes(2);
    const [outbound, inbound] = save.mock.calls.map((c) => c[0]);
    expect(outbound.amount).toBe(-100);
    expect(inbound.amount).toBe(100);
    expect(outbound.transferGroupId).toBe(inbound.transferGroupId);
    expect(result.transferGroupId).toBeTruthy();
  });

  it("rejects a transfer without destination or to the same account", async () => {
    const { service } = build();
    await expect(
      service.createTransaction(
        "u1",
        baseDto({ type: "transfer", transferAccountId: null }),
      ),
    ).rejects.toMatchObject({ response: { code: ErrorCode.VALIDATION_ERROR } });
    await expect(
      service.createTransaction(
        "u1",
        baseDto({ type: "transfer", transferAccountId: "a1" }),
      ),
    ).rejects.toMatchObject({ response: { code: ErrorCode.VALIDATION_ERROR } });
  });

  it("updates a plain transaction and enforces the category invariant", async () => {
    const { service, repository } = build();
    repository.findOneBy.mockResolvedValue(tx());

    await service.updateTransaction("u1", "t1", {
      amount: -200,
      description: "  edit  ",
    } as any);
    expect(repository.save).toHaveBeenCalledWith(
      expect.objectContaining({ amount: 200, description: "edit" }),
    );

    repository.findOneBy.mockResolvedValue(tx({ categoryId: null }));
    await expect(
      service.updateTransaction("u1", "t1", { amount: 5 } as any),
    ).rejects.toMatchObject({ response: { code: ErrorCode.VALIDATION_ERROR } });
  });

  it("updates both legs of a transfer", async () => {
    const { service, repository, dataSource } = build();
    const outbound = tx({
      type: "transfer",
      amount: -100,
      transferGroupId: "g1",
      accountId: "a1",
      transferAccountId: "a2",
    });
    const inbound = tx({
      id: "t2",
      type: "transfer",
      amount: 100,
      transferGroupId: "g1",
      accountId: "a2",
      transferAccountId: "a1",
    });
    repository.findOneBy.mockResolvedValue(outbound);
    repository.find.mockResolvedValue([outbound, inbound]);

    const result = await service.updateTransaction("u1", "t1", {
      amount: 300,
      accountId: "a3",
      transferAccountId: "a4",
    } as any);

    expect(dataSource.transaction).toHaveBeenCalled();
    expect(result.accountId).toBe("a3");
  });

  it("rejects updating a transfer to equal accounts or a broken group", async () => {
    const { service, repository } = build();
    repository.findOneBy.mockResolvedValue(
      tx({ type: "transfer", transferGroupId: "g1" }),
    );
    repository.find.mockResolvedValue([
      tx({ type: "transfer", transferGroupId: "g1", amount: -1 }),
      tx({ id: "t2", type: "transfer", transferGroupId: "g1", amount: 1 }),
    ]);
    await expect(
      service.updateTransaction("u1", "t1", {
        accountId: "a1",
        transferAccountId: "a1",
      } as any),
    ).rejects.toMatchObject({ response: { code: ErrorCode.VALIDATION_ERROR } });

    repository.find.mockResolvedValue([tx({ transferGroupId: "g1" })]);
    await expect(
      service.updateTransaction("u1", "t1", { amount: 1 } as any),
    ).rejects.toMatchObject({ response: { code: ErrorCode.NOT_FOUND } });
  });

  it("deletes a single transaction or the whole transfer group", async () => {
    const { service, repository } = build();
    repository.findOneBy.mockResolvedValue(tx());
    await service.deleteTransaction("u1", "t1");
    expect(repository.delete).toHaveBeenCalledWith({ id: "t1", userId: "u1" });

    repository.findOneBy.mockResolvedValue(
      tx({ transferGroupId: "g1", type: "transfer" }),
    );
    await service.deleteTransaction("u1", "t1");
    expect(repository.delete).toHaveBeenCalledWith({
      userId: "u1",
      transferGroupId: "g1",
    });
  });

  it("treats a transfer without group as a plain update", async () => {
    const { service, repository } = build();
    repository.findOneBy.mockResolvedValue(
      tx({ type: "transfer", transferGroupId: null }),
    );
    await service.updateTransaction("u1", "t1", { amount: 10 } as any);
    expect(repository.save).toHaveBeenCalled();
  });

  it("rejects clearing the category of an income/expense", async () => {
    const { service, repository } = build();
    repository.findOneBy.mockResolvedValue(tx({ categoryId: "c1" }));
    await expect(
      service.updateTransaction("u1", "t1", { categoryId: null } as any),
    ).rejects.toMatchObject({ response: { code: ErrorCode.VALIDATION_ERROR } });
  });
});
