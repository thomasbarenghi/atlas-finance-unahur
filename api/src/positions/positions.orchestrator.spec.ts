import { mockConfig } from "../../test/unit/mocks";
import { PositionsOrchestrator } from "./positions.orchestrator";

const position = (overrides: Record<string, unknown> = {}) => ({
  id: "p1",
  symbol: "BTC",
  instrument: "Bitcoin",
  quantity: 2,
  avgCost: 100,
  currency: "USD",
  archived: false,
  ...overrides,
});

const quote = (overrides: Record<string, unknown> = {}) => ({
  symbol: "BTC",
  currency: "USD",
  price: 150,
  provider: "binance",
  fetchedAt: new Date(),
  ...overrides,
});

const build = () => {
  const positionsService = {
    listOwnedPositions: jest.fn().mockResolvedValue([position()]),
    createPosition: jest.fn(async () => position()),
    updatePosition: jest.fn(async () => position()),
    addToPosition: jest.fn(async () => position()),
    archivePosition: jest.fn(async () => position({ archived: true })),
    restorePosition: jest.fn(async () => position({ archived: false })),
    deletePosition: jest.fn(),
  };
  const quotesService = {
    listLatestQuoteEntities: jest.fn().mockResolvedValue([quote()]),
  };
  const calculationsService = {
    calculatePositionValue: jest.fn(
      (quantity: number, avgCost: number, price: number) => {
        const costBasis = quantity * avgCost;
        const currentValue = quantity * price;
        const profitLoss = currentValue - costBasis;
        return {
          costBasis,
          currentValue,
          profitLoss,
          profitLossPct: (profitLoss / costBasis) * 100,
        };
      },
    ),
  };
  const config = mockConfig({ market: { quoteStaleMs: 3_600_000 } });
  const orchestrator = new PositionsOrchestrator(
    positionsService as any,
    quotesService as any,
    calculationsService as any,
    config as any,
  );
  return { orchestrator, positionsService, quotesService };
};

describe("PositionsOrchestrator", () => {
  it("decorates positions with quote value and profit/loss", async () => {
    const { orchestrator } = build();
    const [result] = await orchestrator.listPositions("u1");
    expect(result).toMatchObject({
      currentPrice: 150,
      currentValue: 300,
      costBasis: 200,
      profitLoss: 100,
      profitLossPct: 50,
      quoteProvider: "binance",
      isStale: false,
    });
  });

  it("returns nulls when there is no quote", async () => {
    const { orchestrator, quotesService } = build();
    quotesService.listLatestQuoteEntities.mockResolvedValue([]);
    const [result] = await orchestrator.listPositions("u1");
    expect(result).toMatchObject({
      currentPrice: null,
      currentValue: null,
      profitLoss: null,
      isStale: false,
    });
  });

  it("returns an empty list for no positions", async () => {
    const { orchestrator, positionsService } = build();
    positionsService.listOwnedPositions.mockResolvedValue([]);
    await expect(orchestrator.listPositions("u1")).resolves.toEqual([]);
  });

  it("delegates mutations and re-derives a single position", async () => {
    const { orchestrator } = build();
    await expect(
      orchestrator.createPosition("u1", {} as any),
    ).resolves.toMatchObject({ currentValue: 300 });
    await expect(
      orchestrator.updatePosition("u1", "p1", {} as any),
    ).resolves.toBeDefined();
    await expect(
      orchestrator.addToPosition("u1", "p1", {} as any),
    ).resolves.toBeDefined();
    await expect(
      orchestrator.archivePosition("u1", "p1"),
    ).resolves.toMatchObject({ archived: true });
    await expect(
      orchestrator.restorePosition("u1", "p1"),
    ).resolves.toMatchObject({ archived: false });
    await orchestrator.deletePosition("u1", "p1");
  });

  it("picks the most recent quote for the symbol/currency pair", async () => {
    const { orchestrator, quotesService } = build();
    quotesService.listLatestQuoteEntities.mockResolvedValue([
      quote({
        provider: "old",
        price: 100,
        fetchedAt: new Date(Date.now() - 10_000),
      }),
      quote({ provider: "new", price: 150, fetchedAt: new Date() }),
      quote({ symbol: "ETH", price: 1, fetchedAt: new Date() }),
    ]);
    const [result] = await orchestrator.listPositions("u1");
    expect(result.currentPrice).toBe(150);
    expect(result.quoteProvider).toBe("new");
  });
});
