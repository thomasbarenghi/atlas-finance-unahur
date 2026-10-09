import { DebtTools } from "./debt.tools";

const debt = (overrides: Record<string, unknown> = {}) => ({
  id: "d1",
  name: "Hipoteca",
  type: "mortgage",
  balance: 1000,
  currency: "ARS",
  date: "2026-03-01",
  assetId: null,
  archived: false,
  ...overrides,
});

const ASSET_UUID = "00000000-0000-4000-8000-000000000004";

const build = () => {
  const debts = {
    listDebts: jest.fn().mockResolvedValue([debt()]),
    createDebt: jest.fn().mockResolvedValue(debt()),
    updateDebt: jest.fn().mockResolvedValue(debt({ name: "Editada" })),
    archiveDebt: jest.fn().mockResolvedValue(debt({ archived: true })),
  };
  const users = {
    getById: jest.fn().mockResolvedValue({ baseCurrency: "ARS" }),
  };
  const resolver = {
    resolveDebtId: jest.fn().mockResolvedValue("d1"),
    resolveAssetId: jest.fn().mockResolvedValue(ASSET_UUID),
  };
  const tools = new DebtTools(debts as any, users as any, resolver as any);
  const byName = (name: string) =>
    tools.definitions().find((definition) => definition.name === name)!;
  return { byName, debts, resolver };
};

describe("DebtTools", () => {
  it("lists debts", async () => {
    const { byName } = build();
    expect((await byName("listDebts").execute!("u1", {})).summary).toContain(
      "1",
    );
  });

  it("creates a debt defaulting currency and linking an asset", async () => {
    const { byName, debts, resolver } = build();
    const definition = byName("createDebt");

    const prepared = await definition.prepare!("u1", {
      name: "Hipoteca",
      type: "mortgage",
      balance: 1000,
      date: "2026-03-01",
      asset: "Depto",
    });
    expect(resolver.resolveAssetId).toHaveBeenCalledWith("u1", "Depto");
    expect(prepared.args).toMatchObject({
      currency: "ARS",
      assetId: ASSET_UUID,
    });

    await definition.execute!("u1", prepared.args);
    expect(debts.createDebt).toHaveBeenCalled();
  });

  it("creates a debt without an asset link", async () => {
    const { byName, resolver } = build();
    await byName("createDebt").prepare!("u1", {
      name: "Préstamo",
      type: "loan",
      balance: 100,
      date: "2026-03-01",
    });
    expect(resolver.resolveAssetId).not.toHaveBeenCalled();
  });

  it("updates a debt, supporting unlink and rejecting empty changes", async () => {
    const { byName, debts } = build();
    const definition = byName("updateDebt");

    const prepared = await definition.prepare!("u1", {
      debt: "d1",
      asset: "ninguno",
    });
    expect(prepared.args).toMatchObject({ assetId: null });

    await expect(
      definition.prepare!("u1", { debt: "d1" }),
    ).rejects.toMatchObject({
      response: { code: "VALIDATION_ERROR" },
    });

    await definition.execute!("u1", { debt: "d1", balance: 50 });
    expect(debts.updateDebt).toHaveBeenCalled();
  });

  it("archives a debt", async () => {
    const { byName, debts } = build();
    await byName("archiveDebt").prepare!("u1", { debt: "d1" });
    await byName("archiveDebt").execute!("u1", { debt: "d1" });
    expect(debts.archiveDebt).toHaveBeenCalledWith("u1", "d1");
  });

  it("treats a non-string asset reference as a link", async () => {
    const { byName, resolver } = build();
    await byName("updateDebt").prepare!("u1", { debt: "d1", asset: 123 });
    expect(resolver.resolveAssetId).toHaveBeenCalledWith("u1", 123);
  });
});
