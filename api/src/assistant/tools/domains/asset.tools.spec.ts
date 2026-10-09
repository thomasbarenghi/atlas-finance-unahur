import { AssetTools } from "./asset.tools";

const asset = (overrides: Record<string, unknown> = {}) => ({
  id: "asset-1",
  name: "Depto",
  type: "property",
  currency: "ARS",
  currentValue: 100,
  valuationDate: "2026-03-01",
  archived: false,
  ...overrides,
});

const build = () => {
  const assets = {
    listAssets: jest.fn().mockResolvedValue([asset()]),
    listValuations: jest.fn().mockResolvedValue([{ id: "v1" }]),
    getAsset: jest.fn().mockResolvedValue(asset()),
    createAsset: jest.fn().mockResolvedValue(asset()),
    updateAsset: jest.fn().mockResolvedValue(asset({ name: "Editado" })),
    createValuation: jest
      .fn()
      .mockResolvedValue({ id: "v1", value: 200, currency: "ARS" }),
    archiveAsset: jest.fn().mockResolvedValue(asset({ archived: true })),
  };
  const users = {
    getById: jest.fn().mockResolvedValue({ baseCurrency: "ARS" }),
  };
  const resolver = { resolveAssetId: jest.fn().mockResolvedValue("asset-1") };
  const tools = new AssetTools(assets as any, users as any, resolver as any);
  const byName = (name: string) =>
    tools.definitions().find((definition) => definition.name === name)!;
  return { byName, assets, resolver };
};

describe("AssetTools", () => {
  it("lists assets and valuations", async () => {
    const { byName, resolver } = build();
    expect((await byName("listAssets").execute!("u1", {})).summary).toContain(
      "1",
    );
    const valuations = await byName("listValuations").execute!("u1", {
      asset: "Depto",
    });
    expect(resolver.resolveAssetId).toHaveBeenCalledWith("u1", "Depto");
    expect(valuations.summary).toContain("1");
  });

  it("creates an asset defaulting the currency", async () => {
    const { byName, assets } = build();
    assets.listAssets.mockResolvedValue([]);
    const definition = byName("createAsset");

    const prepared = await definition.prepare!("u1", {
      name: "Auto",
      type: "vehicle",
      initialValue: 100,
      date: "2026-03-01",
    });
    expect(prepared.args).toMatchObject({ currency: "ARS" });

    await definition.execute!("u1", prepared.args);
    expect(assets.createAsset).toHaveBeenCalled();
  });

  it("rejects creating a duplicate asset by normalized name", async () => {
    const { byName } = build();
    await expect(
      byName("createAsset").prepare!("u1", {
        name: "deptó",
        type: "property",
        initialValue: 1,
        date: "2026-03-01",
        currency: "ARS",
      }),
    ).rejects.toMatchObject({ response: { code: "VALIDATION_ERROR" } });
  });

  it("updates an asset and rejects empty changes", async () => {
    const { byName, assets } = build();
    const definition = byName("updateAsset");
    await definition.prepare!("u1", { asset: "asset-1", name: "Nuevo" });
    await expect(
      definition.prepare!("u1", { asset: "asset-1" }),
    ).rejects.toMatchObject({
      response: { code: "VALIDATION_ERROR" },
    });
    await definition.execute!("u1", { asset: "asset-1", name: "Nuevo" });
    expect(assets.updateAsset).toHaveBeenCalled();
  });

  it("registers a valuation defaulting the currency to the asset", async () => {
    const { byName, assets } = build();
    const definition = byName("createValuation");

    const prepared = await definition.prepare!("u1", {
      asset: "asset-1",
      value: 200,
      date: "2026-04-01",
    });
    expect(prepared.args).toMatchObject({ currency: "ARS" });

    await definition.execute!("u1", prepared.args);
    expect(assets.createValuation).toHaveBeenCalled();
  });

  it("archives an asset", async () => {
    const { byName, assets } = build();
    await byName("archiveAsset").prepare!("u1", { asset: "asset-1" });
    await byName("archiveAsset").execute!("u1", { asset: "asset-1" });
    expect(assets.archiveAsset).toHaveBeenCalledWith("u1", "asset-1");
  });
});
