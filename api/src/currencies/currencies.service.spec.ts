import { ErrorCode } from "../common/errors/error-codes";
import { mockQueryBuilder, mockRepository } from "../../test/unit/mocks";
import { CurrenciesService } from "./currencies.service";

const RATE_DATE = "2026-10-25";

const build = () => {
  const usersRepository = mockRepository();
  const accountsRepository = mockRepository();
  const provider = { fetch: jest.fn() };

  usersRepository.findOneBy.mockResolvedValue({
    id: "u1",
    primaryCurrency: "ARS",
  });
  accountsRepository.createQueryBuilder.mockReturnValue(
    mockQueryBuilder([{ currency: "USD" }, { currency: "EUR" }]),
  );
  provider.fetch.mockResolvedValue({
    date: RATE_DATE,
    rates: { ARS: 1, USD: 1180, EUR: 1275.4 },
  });

  const service = new CurrenciesService(
    usersRepository as any,
    accountsRepository as any,
    provider as any,
  );

  return { service, usersRepository, accountsRepository, provider };
};

describe("CurrenciesService", () => {
  it("exposes the global catalog", () => {
    const { service } = build();
    const catalog = service.getCatalog();
    expect(catalog).toHaveLength(54);
    expect(catalog[0]).toMatchObject({ code: "ARS", name: "Peso argentino" });
  });

  it("builds the rate context from the API on every read", async () => {
    const { service, provider } = build();

    const context = await service.getRateContext("u1");
    await service.getRateContext("u1");

    expect(context.primaryCurrency).toBe("ARS");
    expect(context.rates.get("USD")).toBe(1180);
    expect(context.rates.get("EUR")).toBe(1275.4);
    expect(context.rates.get("ARS")).toBe(1);
    expect(context.rateDate).toBe(RATE_DATE);
    expect(context.rateDates.get("USD")).toBe(RATE_DATE);
    expect(provider.fetch).toHaveBeenCalledTimes(2);
  });

  it("returns settings only for foreign currencies used by accounts", async () => {
    const { service } = build();

    const settings = await service.getSettings("u1");
    expect(settings.primaryCurrency).toBe("ARS");
    expect(settings.rates.map((rate) => rate.currency)).toEqual(["EUR", "USD"]);
    expect(
      settings.rates.find((rate) => rate.currency === "USD"),
    ).toMatchObject({
      rate: 1180,
      rateDate: RATE_DATE,
      source: "api",
    });
  });

  it("expresses settings in the primary currency", async () => {
    const { service, usersRepository, accountsRepository } = build();
    usersRepository.findOneBy.mockResolvedValue({
      id: "u1",
      primaryCurrency: "USD",
    });
    accountsRepository.createQueryBuilder.mockReturnValue(
      mockQueryBuilder([{ currency: "USD" }, { currency: "ARS" }]),
    );

    const settings = await service.getSettings("u1");
    expect(settings.primaryCurrency).toBe("USD");
    expect(settings.rates).toHaveLength(1);
    expect(settings.rates[0].currency).toBe("ARS");
    expect(settings.rates[0].rate).toBeCloseTo(1 / 1180, 6);
  });

  it("fails with a stable error when the API is unavailable", async () => {
    const { service, provider } = build();
    provider.fetch.mockResolvedValue(null);

    await expect(service.getRateContext("u1")).rejects.toMatchObject({
      response: { code: ErrorCode.EXCHANGE_RATES_UNAVAILABLE },
    });
  });
});
