import { ErrorCode } from "../common/errors/error-codes";
import { mockCurrency, mockRepository } from "../../test/unit/mocks";
import { Asset } from "./entities/asset.entity";
import { Valuation } from "./entities/valuation.entity";
import { AssetsService } from "./assets.service";

const asset = (overrides: Partial<Asset> = {}): Asset =>
  ({
    id: "asset-1",
    userId: "u1",
    name: "Depto",
    type: "property",
    currency: "ARS",
    notes: null,
    archived: false,
    createdAt: new Date("2026-01-01T00:00:00.000Z"),
    updatedAt: new Date("2026-01-01T00:00:00.000Z"),
    ...overrides,
  }) as Asset;

const valuation = (overrides: Partial<Valuation> = {}): Valuation =>
  ({
    id: "v1",
    assetId: "asset-1",
    value: 90000,
    currency: "ARS",
    date: "2026-03-01",
    source: "manual",
    createdAt: new Date("2026-03-01T00:00:00.000Z"),
    ...overrides,
  }) as Valuation;

const build = () => {
  const assetsRepository = mockRepository();
  const valuationsRepository = mockRepository();
  assetsRepository.create.mockImplementation((value: any) => asset(value));
  assetsRepository.save.mockImplementation(async (value: any) => asset(value));
  valuationsRepository.create.mockImplementation((value: any) =>
    valuation(value),
  );
  valuationsRepository.save.mockImplementation(async (value: any) =>
    valuation(value),
  );
  const links = { debtIdByAsset: jest.fn().mockResolvedValue(new Map()) };
  const dataSource = {
    transaction: jest.fn(async (cb: any) =>
      cb({
        create: (_e: any, value: any) => value,
        save: jest.fn(async (value: any) => ({
          id: "asset-1",
          createdAt: new Date("2026-01-01T00:00:00.000Z"),
          updatedAt: new Date("2026-01-01T00:00:00.000Z"),
          ...value,
        })),
      }),
    ),
  };
  const service = new AssetsService(
    assetsRepository as any,
    valuationsRepository as any,
    links as any,
    mockCurrency() as any,
    dataSource as any,
  );
  return { service, assetsRepository, valuationsRepository, links, dataSource };
};

describe("AssetsService", () => {
  it("lists assets with latest valuation and linked debt", async () => {
    const { service, assetsRepository, valuationsRepository, links } = build();
    assetsRepository.find.mockResolvedValue([asset()]);
    valuationsRepository.find.mockResolvedValue([valuation()]);
    links.debtIdByAsset.mockResolvedValue(new Map([["asset-1", "d1"]]));

    const [result] = await service.listAssets("u1");
    expect(result).toMatchObject({
      currentValue: 90000,
      valuationDate: "2026-03-01",
      debtId: "d1",
    });
  });

  it("breaks same-date valuation ties by the most recently created", async () => {
    const { service, assetsRepository, valuationsRepository } = build();
    assetsRepository.find.mockResolvedValue([asset()]);
    valuationsRepository.find.mockResolvedValue([
      valuation({
        id: "v2",
        value: 95000,
        date: "2026-03-01",
        createdAt: new Date("2026-03-01T12:00:00.000Z"),
      }),
      valuation({
        id: "v1",
        value: 90000,
        date: "2026-03-01",
        createdAt: new Date("2026-03-01T08:00:00.000Z"),
      }),
    ]);

    const [result] = await service.listAssets("u1");
    expect(result.currentValue).toBe(95000);
    expect(valuationsRepository.find).toHaveBeenCalledWith(
      expect.objectContaining({
        order: { date: "DESC", createdAt: "DESC" },
      }),
    );
  });

  it("returns an empty list without querying valuations", async () => {
    const { service, assetsRepository, valuationsRepository } = build();
    assetsRepository.find.mockResolvedValue([]);
    await expect(service.listAssets("u1")).resolves.toEqual([]);
    expect(valuationsRepository.find).not.toHaveBeenCalled();
  });

  it("lists owned assets and user valuations", async () => {
    const { service, assetsRepository, valuationsRepository } = build();
    assetsRepository.find.mockResolvedValue([asset()]);
    await expect(service.listOwnedAssets("u1")).resolves.toHaveLength(1);

    valuationsRepository.find.mockResolvedValue([valuation()]);
    await expect(service.listValuationsForUser("u1")).resolves.toHaveLength(1);

    assetsRepository.find.mockResolvedValue([]);
    await expect(service.listValuationsForUser("u1")).resolves.toEqual([]);
  });

  it("creates an asset with its initial valuation", async () => {
    const { service, valuationsRepository } = build();
    valuationsRepository.find.mockResolvedValue([]);

    const result = await service.createAsset("u1", {
      name: "Depto",
      type: "property",
      currency: "ars",
      initialValue: 90000,
      date: "2026-03-01",
    } as any);

    expect(result).toMatchObject({ currentValue: 0, currency: "ARS" });
  });

  it("updates and archives an asset", async () => {
    const { service, assetsRepository, valuationsRepository } = build();
    assetsRepository.findOneBy.mockResolvedValue(asset());
    valuationsRepository.find.mockResolvedValue([valuation()]);

    const updated = await service.updateAsset("u1", "asset-1", {
      name: "  Nuevo  ",
    } as any);
    expect(updated.name).toBe("Nuevo");
    expect((await service.archiveAsset("u1", "asset-1")).archived).toBe(true);
  });

  it("lists and creates valuations for an owned asset", async () => {
    const { service, assetsRepository, valuationsRepository } = build();
    assetsRepository.findOneBy.mockResolvedValue(asset());
    valuationsRepository.find.mockResolvedValue([valuation()]);

    await expect(service.listValuations("u1", "asset-1")).resolves.toHaveLength(
      1,
    );
    const created = await service.createValuation("u1", "asset-1", {
      value: 95000,
      currency: "ars",
      date: "2026-04-01",
    } as any);
    expect(created).toMatchObject({ value: 95000, currency: "ARS" });
  });

  it("throws NOT_FOUND for an unknown asset", async () => {
    const { service, assetsRepository } = build();
    assetsRepository.findOneBy.mockResolvedValue(null);
    await expect(service.getAsset("u1", "x")).rejects.toMatchObject({
      response: { code: ErrorCode.NOT_FOUND },
    });
    await expect(service.assertOwnedAsset("u1", "x")).rejects.toMatchObject({
      response: { code: ErrorCode.NOT_FOUND },
    });
  });
});
