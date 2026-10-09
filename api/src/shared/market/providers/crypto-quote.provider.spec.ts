import axios from "axios";
import { CryptoQuoteProvider } from "./crypto-quote.provider";

jest.mock("axios");
const mockedAxios = axios as jest.Mocked<typeof axios>;

const build = () => {
  const config = {
    get: jest.fn(() => ({
      cryptoUrl: "https://api.binance.com",
      timeoutMs: 1000,
      vsCurrency: "USD",
    })),
  };
  return new CryptoQuoteProvider(config as any);
};

describe("CryptoQuoteProvider", () => {
  beforeEach(() => jest.clearAllMocks());

  it("fetches prices for supported symbols, special-casing the stablecoin", async () => {
    const service = build();
    mockedAxios.get.mockResolvedValue({
      data: { lastPrice: "150", priceChangePercent: "1.5" },
    } as any);

    const quotes = await service.fetchQuotes(["btc", "USDT", "XYZ"]);

    expect(quotes).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ symbol: "BTC", price: 150, change24h: 1.5 }),
        expect.objectContaining({ symbol: "USDT", price: 1, change24h: null }),
      ]),
    );
    expect(quotes.find((q) => q.symbol === "XYZ")).toBeUndefined();
    // USDT is resolved without an HTTP call.
    expect(mockedAxios.get).toHaveBeenCalledTimes(1);
  });

  it("returns an empty list when no symbol is supported", async () => {
    const service = build();
    await expect(service.fetchQuotes(["XYZ"])).resolves.toEqual([]);
    expect(mockedAxios.get).not.toHaveBeenCalled();
  });

  it("skips a symbol with an invalid price", async () => {
    const service = build();
    mockedAxios.get.mockResolvedValue({
      data: { lastPrice: "not-a-number", priceChangePercent: "x" },
    } as any);
    await expect(service.fetchQuotes(["BTC"])).resolves.toEqual([]);
  });

  it("ignores per-symbol provider failures", async () => {
    const service = build();
    mockedAxios.get.mockRejectedValue(new Error("network"));
    await expect(service.fetchQuotes(["BTC"])).resolves.toEqual([]);
  });
});
