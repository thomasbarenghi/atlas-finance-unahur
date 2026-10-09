import { PositionTools } from "./position.tools";

const position = (overrides: Record<string, unknown> = {}) => ({
  id: "p1",
  symbol: "BTC",
  instrument: "Bitcoin",
  quantity: 1,
  avgCost: 100,
  currency: "USD",
  archived: false,
  ...overrides,
});

const build = () => {
  const positions = {
    listPositions: jest.fn().mockResolvedValue([position()]),
    createPosition: jest.fn().mockResolvedValue(position()),
    updatePosition: jest.fn().mockResolvedValue(position({ symbol: "ETH" })),
    addToPosition: jest.fn().mockResolvedValue(position({ quantity: 2 })),
    archivePosition: jest.fn().mockResolvedValue(position({ archived: true })),
    restorePosition: jest.fn().mockResolvedValue(position({ archived: false })),
    deletePosition: jest.fn(),
  };
  const resolver = { resolvePositionId: jest.fn().mockResolvedValue("p1") };
  const tools = new PositionTools(positions as any, resolver as any);
  const byName = (name: string) =>
    tools.definitions().find((definition) => definition.name === name)!;
  return { byName, positions, resolver };
};

describe("PositionTools", () => {
  it("lists positions", async () => {
    const { byName } = build();
    expect(
      (await byName("listPositions").execute!("u1", {})).summary,
    ).toContain("1");
  });

  it("prepares and executes addToPosition", async () => {
    const { byName, positions } = build();
    const definition = byName("addToPosition");

    const prepared = await definition.prepare!("u1", {
      position: "BTC",
      amount: 500,
      unitPrice: 250,
    });
    expect(prepared.preview.fields).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ label: "Cantidad aprox." }),
      ]),
    );

    const result = await definition.execute!("u1", {
      position: "p1",
      amount: 500,
      unitPrice: 250,
    });
    expect(positions.addToPosition).toHaveBeenCalledWith("u1", "p1", {
      amount: 500,
      unitPrice: 250,
    });
    expect(result.entity).toMatchObject({ id: "p1" });
  });

  it("handles an unknown position when preparing", async () => {
    const { byName, positions } = build();
    positions.listPositions.mockResolvedValue([]);
    const prepared = await byName("addToPosition").prepare!("u1", {
      position: "BTC",
      amount: 100,
      unitPrice: 100,
    });
    expect(prepared.args).toMatchObject({ position: "p1" });
  });

  it("creates a position", async () => {
    const { byName, positions } = build();
    const definition = byName("createPosition");
    await definition.prepare!("u1", {
      symbol: "BTC",
      instrument: "Bitcoin",
      quantity: 1,
      avgCost: 100,
      currency: "USD",
    });
    await definition.execute!("u1", {
      symbol: "BTC",
      instrument: "Bitcoin",
      quantity: 1,
      avgCost: 100,
      currency: "USD",
    });
    expect(positions.createPosition).toHaveBeenCalled();
  });

  it("updates a position and rejects empty changes", async () => {
    const { byName, positions } = build();
    const definition = byName("updatePosition");

    await definition.prepare!("u1", { position: "p1", quantity: 3 });
    await expect(
      definition.prepare!("u1", { position: "p1" }),
    ).rejects.toMatchObject({
      response: { code: "VALIDATION_ERROR" },
    });

    const result = await definition.execute!("u1", {
      position: "p1",
      quantity: 3,
    });
    expect(positions.updatePosition).toHaveBeenCalled();
    expect(result.summary).toContain("ETH");
  });

  it("deletes a position", async () => {
    const { byName, positions } = build();
    await byName("deletePosition").prepare!("u1", { position: "p1" });
    const result = await byName("deletePosition").execute!("u1", {
      position: "p1",
    });
    expect(positions.deletePosition).toHaveBeenCalledWith("u1", "p1");
    expect(result.ok).toBe(true);
  });

  it("archives and restores a position", async () => {
    const { byName, positions } = build();
    await byName("archivePosition").prepare!("u1", { position: "p1" });
    await byName("archivePosition").execute!("u1", { position: "p1" });
    await byName("restorePosition").execute!("u1", { position: "p1" });
    expect(positions.archivePosition).toHaveBeenCalledWith("u1", "p1");
    expect(positions.restorePosition).toHaveBeenCalledWith("u1", "p1");
  });
});
