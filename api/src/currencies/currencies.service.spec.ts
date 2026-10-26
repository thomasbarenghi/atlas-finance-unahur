import { mockQueryBuilder, mockRepository } from "../../test/unit/mocks";
import { CurrenciesService } from "./currencies.service";
import { CurrencyRate } from "./entities/currency-rate.entity";

const today = new Date().toISOString().slice(0, 10);

const rateRow = (currency: string, rate: number): CurrencyRate =>
  ({
    currency,
    rate,
    rateDate: today,
    source: "api",
    updatedAt: new Date(),
  }) as CurrencyRate;

const build = () => {
  const ratesRepository = mockRepository();
  const usersRepository = mockRepository();
  const accountsRepository = mockRepository();
  const provider = { fetch: jest.fn() };

  ratesRepository.find.mockResolvedValue([]);
  usersRepository.findOneBy.mockResolvedValue({
    id: "u1",
    primaryCurrency: "ARS",
  });
  accountsRepository.createQueryBuilder.mockReturnValue(
    mockQueryBuilder([{ currency: "USD" }, { currency: "EUR" }]),
  );

  const service = new CurrenciesService(
    ratesRepository as any,
    usersRepository as any,
    accountsRepository as any,
    provider as any,
  );

  return {
    service,
    ratesRepository,
    usersRepository,
    accountsRepository,
    provider,
  };
};

describe("CurrenciesService", () => {
  it("exposes the global catalog", () => {
    const { service } = build();
    const catalog = service.getCatalog();
    expect(catalog).toHaveLength(54);
    expect(catalog[0]).toMatchObject({ code: "ARS", name: "Peso argentino" });
  });

  it("builds the rate context in ARS per unit and keeps the primary currency", async () => {
    const { service, ratesRepository, usersRepository } = build();
    ratesRepository.find.mockResolvedValue([
      rateRow("USD", 1180),
      rateRow("EUR", 1275.4),
    ]);
    usersRepository.findOneBy.mockResolvedValue({
      id: "u1",
      primaryCurrency: "ARS",
    });

    const context = await service.getRateContext("u1");
    expect(context.primaryCurrency).toBe("ARS");
    expect(context.rates.get("USD")).toBe(1180);
    expect(context.rates.get("EUR")).toBe(1275.4);
    expect(context.rates.get("ARS")).toBe(1);
    expect(context.rateDate).toBe(today);
  });

  it("returns settings only for foreign currencies used by accounts", async () => {
    const { service, ratesRepository } = build();
    ratesRepository.find.mockResolvedValue([
      rateRow("USD", 1180),
      rateRow("EUR", 1275.4),
    ]);

    const settings = await service.getSettings("u1");
    expect(settings.primaryCurrency).toBe("ARS");
    expect(settings.rates.map((rate) => rate.currency)).toEqual(["EUR", "USD"]);
    expect(settings.rates.find((rate) => rate.currency === "USD")?.rate).toBe(
      1180,
    );
  });

  it("expresses settings in the primary currency", async () => {
    const { service, ratesRepository, usersRepository, accountsRepository } =
      build();
    ratesRepository.find.mockResolvedValue([
      rateRow("USD", 1180),
      rateRow("ARS", 1),
    ]);
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

  it("refreshes the global quotes from the provider", async () => {
    const { service, ratesRepository, provider } = build();
    ratesRepository.find.mockResolvedValue([rateRow("USD", 1180)]);
    provider.fetch.mockResolvedValue({
      date: "2026-10-25",
      rates: { ARS: 1, USD: 1180, EUR: 1275.4 },
    });

    const result = await service.refreshRates();
    expect(result).toEqual({ updated: true, date: "2026-10-25" });
    expect(ratesRepository.save).toHaveBeenCalled();
    const saved = ratesRepository.save.mock.calls[0][0];
    expect(saved).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          currency: "USD",
          rate: 1180,
          rateDate: "2026-10-25",
          source: "api",
        }),
      ]),
    );
  });

  it("keeps the current quotes when the provider is unavailable", async () => {
    const { service, provider } = build();
    provider.fetch.mockResolvedValue(null);
    await expect(service.refreshRates()).resolves.toEqual({
      updated: false,
      date: null,
    });
  });
});
