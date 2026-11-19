import axios from "axios";
import { ExchangeRatesProvider } from "./exchange-rates.provider";

jest.mock("axios");
const mockedAxios = axios as jest.Mocked<typeof axios>;

describe("ExchangeRatesProvider", () => {
  beforeEach(() => jest.clearAllMocks());

  it("disables redirects and keeps a timeout", async () => {
    mockedAxios.get.mockResolvedValueOnce({
      data: { date: "2026-10-30", ars: { usd: 0.001 } },
    } as never);

    const provider = new ExchangeRatesProvider();
    const result = await provider.fetch();

    expect(result?.rates.USD).toBeCloseTo(1000);
    expect(mockedAxios.get).toHaveBeenCalledWith(
      expect.stringContaining("currency-api"),
      expect.objectContaining({ timeout: 6_000, maxRedirects: 0 }),
    );
  });

  it("returns null when the provider rejects the request", async () => {
    mockedAxios.get.mockRejectedValueOnce(new Error("redirect not followed"));

    const provider = new ExchangeRatesProvider();

    await expect(provider.fetch()).resolves.toBeNull();
  });
});
