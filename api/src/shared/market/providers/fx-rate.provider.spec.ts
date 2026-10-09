import axios from "axios";
import { FxRateProvider } from "./fx-rate.provider";

jest.mock("axios");
const mockedAxios = axios as jest.Mocked<typeof axios>;

const build = () => {
  const config = {
    get: jest.fn(() => ({ fxUrl: "https://fx.example", timeoutMs: 1000 })),
  };
  return new FxRateProvider(config as any);
};

describe("FxRateProvider", () => {
  beforeEach(() => jest.clearAllMocks());

  it("derives rates against ARS and skips invalid/unsupported entries", async () => {
    const service = build();
    mockedAxios.get.mockResolvedValue({
      data: {
        date: "2026-01-01",
        ars: { usd: 0.001, eur: 0.0009, brl: 0, xyz: "nope" },
      },
    } as any);

    const rates = await service.fetchRates(["USD", "EUR", "BRL", "ARS", "XYZ"]);

    expect(rates).toEqual([
      expect.objectContaining({
        baseCurrency: "USD",
        quoteCurrency: "ARS",
        rate: 1000,
        provider: "fawaz",
      }),
      expect.objectContaining({
        baseCurrency: "EUR",
        quoteCurrency: "ARS",
        rate: 1000 / 0.9,
      }),
    ]);
  });

  it("throws when the provider returns no pivot data", async () => {
    const service = build();
    mockedAxios.get.mockResolvedValue({ data: { date: "2026-01-01" } } as any);
    await expect(service.fetchRates(["USD"])).rejects.toThrow(
      /tipos de cambio/,
    );
  });
});
