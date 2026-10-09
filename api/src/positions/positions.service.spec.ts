import { Repository } from "typeorm";
import { Position } from "./entities/position.entity";
import { PositionsService } from "./positions.service";

const buildService = () => {
  const position = {
    id: "position-1",
    userId: "user-1",
    symbol: "ETH",
    instrument: "Ethereum",
    quantity: 0.8,
    avgCost: 2500,
    currency: "USD",
    createdAt: new Date("2026-01-01T00:00:00.000Z"),
    updatedAt: new Date("2026-01-01T00:00:00.000Z"),
  } as unknown as Position;

  const findOneBy = jest.fn().mockResolvedValue({ ...position });
  const save = jest.fn((entity: Position) => Promise.resolve(entity));
  const positionsRepository = {
    findOneBy,
    save,
  } as unknown as Repository<Position>;

  const service = new PositionsService(positionsRepository);

  return { service, positionsRepository, findOneBy, save };
};

describe("PositionsService.addToPosition", () => {
  it("adds the quantity and recomputes the weighted average cost", async () => {
    const { service, save } = buildService();

    const result = await service.addToPosition("user-1", "position-1", {
      amount: 500,
      unitPrice: 2525,
    });

    expect(save).toHaveBeenCalled();
    expect(result.quantity).toBeCloseTo(0.998_019_8, 6);
    expect(result.avgCost).toBeCloseTo(2504.96, 1);
  });

  it("fails when the position does not belong to the user", async () => {
    const { service, findOneBy } = buildService();
    findOneBy.mockResolvedValue(null);

    await expect(
      service.addToPosition("user-1", "other", {
        amount: 500,
        unitPrice: 2525,
      }),
    ).rejects.toThrow(/no existe/);
  });
});
