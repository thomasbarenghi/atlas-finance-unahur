import { Repository } from "typeorm";
import { mockCurrency, mockRepository } from "../../test/unit/mocks";
import { Position } from "./entities/position.entity";
import { PositionsService } from "./positions.service";

const buildService = () => {
  const position = {
    id: "position-1",
    userId: "user-1",
    symbol: "ETH",
    instrument: "Ethereum",
    quantity: 0.8,
    avgCost: 2500,
    currency: "USD",
    createdAt: new Date("2026-01-01T00:00:00.000Z"),
    updatedAt: new Date("2026-01-01T00:00:00.000Z"),
  } as unknown as Position;

  const findOneBy = jest.fn().mockResolvedValue({ ...position });
  const save = jest.fn((entity: Position) => Promise.resolve(entity));
  const positionsRepository = {
    findOneBy,
    save,
  } as unknown as Repository<Position>;

  const service = new PositionsService(
    positionsRepository,
    mockCurrency() as any,
  );

  return { service, positionsRepository, findOneBy, save };
};

describe("PositionsService.addToPosition", () => {
  it("adds the quantity and recomputes the weighted average cost", async () => {
    const { service, save } = buildService();

    const result = await service.addToPosition("user-1", "position-1", {
      amount: 500,
      unitPrice: 2525,
    });

    expect(save).toHaveBeenCalled();
    expect(result.quantity).toBeCloseTo(0.998_019_8, 6);
    expect(result.avgCost).toBeCloseTo(2504.96, 1);
  });

  it("fails when the position does not belong to the user", async () => {
    const { service, findOneBy } = buildService();
    findOneBy.mockResolvedValue(null);

    await expect(
      service.addToPosition("user-1", "other", {
        amount: 500,
        unitPrice: 2525,
      }),
    ).rejects.toThrow(/no existe/);
  });
});

const position = (overrides: Record<string, unknown> = {}) => ({
  id: "p1",
  userId: "u1",
  symbol: "ETH",
  instrument: "Ethereum",
  quantity: 1,
  avgCost: 100,
  currency: "USD",
  archived: false,
  createdAt: new Date("2026-01-01T00:00:00.000Z"),
  updatedAt: new Date("2026-01-01T00:00:00.000Z"),
  ...overrides,
});

const buildRepository = () => {
  const repository = mockRepository();
  repository.create.mockImplementation((value: any) => position(value));
  repository.save.mockImplementation(async (value: any) => position(value));
  const service = new PositionsService(
    repository as any,
    mockCurrency() as any,
  );
  return { service, repository };
};

describe("PositionsService CRUD", () => {
  it("lists owned positions", async () => {
    const { service, repository } = buildRepository();
    repository.find.mockResolvedValue([position()]);
    await expect(service.listOwnedPositions("u1")).resolves.toHaveLength(1);
  });

  it("lists distinct symbols", async () => {
    const { service, repository } = buildRepository();
    const qb = {
      select: jest.fn().mockReturnThis(),
      getRawMany: jest
        .fn()
        .mockResolvedValue([{ symbol: "BTC" }, { symbol: "ETH" }]),
    };
    repository.createQueryBuilder.mockReturnValue(qb);
    await expect(service.listDistinctSymbols()).resolves.toEqual([
      "BTC",
      "ETH",
    ]);
  });

  it("gets an owned position and rejects a missing one", async () => {
    const { service, repository } = buildRepository();
    repository.findOneBy.mockResolvedValue(position());
    await expect(service.getOwnedPosition("u1", "p1")).resolves.toMatchObject({
      id: "p1",
    });

    repository.findOneBy.mockResolvedValue(null);
    await expect(service.getOwnedPosition("u1", "x")).rejects.toMatchObject({
      response: { code: "NOT_FOUND" },
    });
  });

  it("creates a position uppercasing symbol and currency", async () => {
    const { service, repository } = buildRepository();
    await service.createPosition("u1", {
      symbol: "btc",
      instrument: "Bitcoin",
      quantity: 1,
      avgCost: 100,
      currency: "usd",
    });
    expect(repository.create).toHaveBeenCalledWith(
      expect.objectContaining({ symbol: "BTC", currency: "USD" }),
    );
  });

  it("updates the provided fields", async () => {
    const { service, repository } = buildRepository();
    repository.findOneBy.mockResolvedValue(position());
    const updated = await service.updatePosition("u1", "p1", {
      symbol: "sol",
      quantity: 5,
      currency: "eur",
    } as any);
    expect(updated).toMatchObject({ symbol: "SOL", currency: "EUR" });
  });

  it("archives and restores a position", async () => {
    const { service, repository } = buildRepository();
    repository.findOneBy.mockResolvedValue(position());
    expect((await service.archivePosition("u1", "p1")).archived).toBe(true);
    expect((await service.restorePosition("u1", "p1")).archived).toBe(false);
  });

  it("deletes a position and rejects a missing one", async () => {
    const { service, repository } = buildRepository();
    await service.deletePosition("u1", "p1");
    expect(repository.delete).toHaveBeenCalledWith({ id: "p1", userId: "u1" });

    repository.delete.mockResolvedValue({ affected: 0 });
    await expect(service.deletePosition("u1", "x")).rejects.toMatchObject({
      response: { code: "NOT_FOUND" },
    });
  });
});
