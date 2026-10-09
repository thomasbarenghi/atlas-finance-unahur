import { mockConfig } from "../../../test/unit/mocks";
import { MarketService } from "./market.service";

const build = () => {
  const cryptoQuoteProvider = {
    fetchQuotes: jest.fn().mockResolvedValue([
      {
        symbol: "BTC",
        price: 1,
        currency: "USD",
        provider: "binance",
        change24h: null,
      },
    ]),
  };
  const fxRateProvider = {
    fetchRates: jest.fn().mockResolvedValue([
      {
        baseCurrency: "USD",
        quoteCurrency: "ARS",
        rate: 1000,
        provider: "fawaz",
      },
    ]),
  };
  const quotesService = { upsertQuotes: jest.fn().mockResolvedValue(1) };
  const fxService = { upsertRates: jest.fn().mockResolvedValue(1) };
  const positionsService = {
    listDistinctSymbols: jest.fn().mockResolvedValue(["BTC"]),
  };
  const config = mockConfig({
    market: { symbols: ["BTC", "ETH"], vsCurrency: "USD" },
    supportedCurrencies: ["ARS", "USD", "EUR"],
  });

  const service = new MarketService(
    config as any,
    cryptoQuoteProvider as any,
    fxRateProvider as any,
    quotesService as any,
    fxService as any,
    positionsService as any,
  );
  return {
    service,
    cryptoQuoteProvider,
    fxRateProvider,
    quotesService,
    fxService,
    positionsService,
  };
};

describe("MarketService", () => {
  it("refreshes crypto and FX including user-tracked symbols", async () => {
    const { service, cryptoQuoteProvider, quotesService, fxService } = build();
    const result = await service.refresh();

    expect(cryptoQuoteProvider.fetchQuotes).toHaveBeenCalledWith(
      expect.arrayContaining(["BTC", "ETH"]),
    );
    expect(quotesService.upsertQuotes).toHaveBeenCalled();
    expect(fxService.upsertRates).toHaveBeenCalled();
    expect(result).toMatchObject({
      crypto: { updated: 1, error: null },
      fx: { updated: 1, error: null },
    });
    expect(typeof result.refreshedAt).toBe("string");
  });

  it("degrades gracefully when a provider fails", async () => {
    const { service, cryptoQuoteProvider, fxRateProvider } = build();
    cryptoQuoteProvider.fetchQuotes.mockRejectedValue(new Error("down"));
    fxRateProvider.fetchRates.mockRejectedValue(new Error("down"));

    const result = await service.refresh();
    expect(result.crypto).toEqual({ updated: 0, error: "down" });
    expect(result.fx).toEqual({ updated: 0, error: "down" });
  });

  it("reports unknown errors with a generic message", async () => {
    const { service, cryptoQuoteProvider } = build();
    cryptoQuoteProvider.fetchQuotes.mockRejectedValue("boom");
    const result = await service.refresh();
    expect(result.crypto).toEqual({ updated: 0, error: "Error desconocido" });
  });
});
