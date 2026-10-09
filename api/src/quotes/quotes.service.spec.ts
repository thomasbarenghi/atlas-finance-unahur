import { mockConfig, mockRepository } from "../../test/unit/mocks";
import { Quote } from "./entities/quote.entity";
import { QuotesService } from "./quotes.service";

const quote = (overrides: Partial<Quote> = {}): Quote =>
  ({
    id: "q1",
    symbol: "BTC",
    price: 64000,
    currency: "USD",
    provider: "binance",
    change24h: 1.8,
    fetchedAt: new Date(),
    ...overrides,
  }) as Quote;

const build = () => {
  const repository = mockRepository();
  const config = mockConfig({ market: { quoteStaleMs: 3_600_000 } });
  const service = new QuotesService(repository as any, config as any);
  return { service, repository };
};

describe("QuotesService", () => {
  it("returns the latest quote per symbol/currency with staleness", async () => {
    const { service, repository } = build();
    repository.find.mockResolvedValue([
      quote({
        id: "old",
        provider: "binance",
        fetchedAt: new Date(Date.now() - 2 * 60 * 60 * 1000),
      }),
      quote({ id: "new", provider: "other", fetchedAt: new Date() }),
      quote({ id: "eth", symbol: "ETH", fetchedAt: new Date() }),
    ]);

    const result = await service.listQuotes();
    const btc = result.filter((q) => q.symbol === "BTC");
    expect(btc).toHaveLength(1);
    expect(btc[0].isStale).toBe(false);
    expect(btc.find((q) => q.provider === "binance")).toBeUndefined();
    expect(result.find((q) => q.symbol === "ETH")).toBeDefined();
  });

  it("marks an old quote as stale", async () => {
    const { service, repository } = build();
    repository.find.mockResolvedValue([
      quote({ fetchedAt: new Date(Date.now() - 2 * 60 * 60 * 1000) }),
    ]);
    const [result] = await service.listQuotes();
    expect(result.isStale).toBe(true);
  });

  it("returns latest quote entities", async () => {
    const { service, repository } = build();
    repository.find.mockResolvedValue([quote()]);
    await expect(service.listLatestQuoteEntities()).resolves.toHaveLength(1);
  });

  it("does nothing when there are no quotes to upsert", async () => {
    const { service, repository } = build();
    await expect(service.upsertQuotes([])).resolves.toBe(0);
    expect(repository.manager.transaction).not.toHaveBeenCalled();
  });

  it("replaces other providers and upserts within a transaction", async () => {
    const { service, repository } = build();
    const managerDelete = jest.fn().mockResolvedValue({});
    const managerUpsert = jest.fn().mockResolvedValue({});
    repository.manager.transaction.mockImplementation(async (cb: any) =>
      cb({ delete: managerDelete, upsert: managerUpsert }),
    );

    const count = await service.upsertQuotes([
      {
        symbol: "btc",
        price: 64000,
        currency: "usd",
        provider: "binance",
        change24h: 1.2,
      },
    ]);

    expect(count).toBe(1);
    expect(managerDelete).toHaveBeenCalled();
    expect(managerUpsert).toHaveBeenCalledWith(
      expect.anything(),
      [
        expect.objectContaining({
          symbol: "BTC",
          currency: "USD",
          provider: "binance",
        }),
      ],
      ["symbol", "currency", "provider"],
    );
  });
});
