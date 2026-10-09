import { mockRepository } from "../../test/unit/mocks";
import { FxService } from "./fx.service";

describe("FxService", () => {
  const build = () => {
    const repository = mockRepository();
    const service = new FxService(repository as any);
    return { service, repository };
  };

  it("seeds default rates only when the table is empty", async () => {
    const { service, repository } = build();
    repository.count.mockResolvedValue(1);
    await service.onModuleInit();
    expect(repository.save).not.toHaveBeenCalled();

    repository.count.mockResolvedValue(0);
    await service.onModuleInit();
    expect(repository.save).toHaveBeenCalled();
  });

  it("converts identity, direct, inverse and pivot rates", async () => {
    const { service, repository } = build();
    repository.find.mockResolvedValue([
      {
        baseCurrency: "USD",
        quoteCurrency: "ARS",
        rate: 1000,
        date: "2026-01-01",
        createdAt: new Date("2026-01-01"),
      },
      {
        baseCurrency: "EUR",
        quoteCurrency: "ARS",
        rate: 1100,
        date: "2026-01-01",
        createdAt: new Date("2026-01-01"),
      },
    ]);

    const convert = await service.getConverter();
    expect(convert(100, "ARS", "ARS")).toBe(100); // identity
    expect(convert(2, "USD", "ARS")).toBe(2000); // direct
    expect(convert(2000, "ARS", "USD")).toBe(2); // inverse
    expect(convert(1, "USD", "EUR")).toBeCloseTo(1000 / 1100, 4); // pivot via ARS
    expect(() => convert(5, "GBP", "ARS")).toThrow(/No hay tasa de cambio/); // no silent 1:1
  });

  it("uses the latest rate for a pair", async () => {
    const { service, repository } = build();
    repository.find.mockResolvedValue([
      {
        baseCurrency: "USD",
        quoteCurrency: "ARS",
        rate: 500,
        date: "2025-01-01",
        createdAt: new Date("2025-01-01"),
      },
      {
        baseCurrency: "USD",
        quoteCurrency: "ARS",
        rate: 1000,
        date: "2026-01-01",
        createdAt: new Date("2026-01-01"),
      },
    ]);
    const convert = await service.getConverter();
    expect(convert(1, "USD", "ARS")).toBe(1000);
  });

  it("converts a single amount through the converter", async () => {
    const { service, repository } = build();
    repository.find.mockResolvedValue([
      {
        baseCurrency: "USD",
        quoteCurrency: "ARS",
        rate: 1000,
        date: "2026-01-01",
        createdAt: new Date("2026-01-01"),
      },
    ]);
    await expect(service.convert(2, "USD", "ARS")).resolves.toBe(2000);
  });

  it("upserts rates normalizing currency and defaulting the date", async () => {
    const { service, repository } = build();
    await expect(service.upsertRates([])).resolves.toBe(0);

    const count = await service.upsertRates([
      {
        baseCurrency: "usd",
        quoteCurrency: "ars",
        rate: 1000,
        provider: "seed",
      },
    ]);
    expect(count).toBe(1);
    expect(repository.upsert).toHaveBeenCalledWith(
      [
        expect.objectContaining({
          baseCurrency: "USD",
          quoteCurrency: "ARS",
          provider: "seed",
        }),
      ],
      ["baseCurrency", "quoteCurrency", "provider", "date"],
    );
  });
});
