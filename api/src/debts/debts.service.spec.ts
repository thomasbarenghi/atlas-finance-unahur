import { ErrorCode } from "../common/errors/error-codes";
import { mockCurrency, mockRepository } from "../../test/unit/mocks";
import { Debt } from "./entities/debt.entity";
import { DebtsService } from "./debts.service";
import { DebtsOrchestrator } from "./debts.orchestrator";

const debt = (overrides: Partial<Debt> = {}): Debt =>
  ({
    id: "d1",
    userId: "u1",
    name: "Hipoteca",
    type: "mortgage",
    balance: 1000,
    currency: "ARS",
    date: "2026-03-01",
    archived: false,
    assetId: null,
    createdAt: new Date("2026-03-01T00:00:00.000Z"),
    updatedAt: new Date("2026-03-01T00:00:00.000Z"),
    ...overrides,
  }) as Debt;

describe("DebtsService", () => {
  const build = () => {
    const repository = mockRepository();
    repository.create.mockImplementation((value: any) => debt(value));
    repository.save.mockImplementation(async (value: any) => debt(value));
    const service = new DebtsService(repository as any, mockCurrency() as any);
    return { service, repository };
  };

  it("lists debts and owned entities", async () => {
    const { service, repository } = build();
    repository.find.mockResolvedValue([debt()]);
    await expect(service.listDebts("u1")).resolves.toHaveLength(1);
    await expect(service.listOwnedDebts("u1")).resolves.toHaveLength(1);
  });

  it("creates a debt, keeping the asset link nullable", async () => {
    const { service } = build();
    const created = await service.createDebt("u1", {
      name: "  Hipoteca  ",
      type: "mortgage",
      balance: 1000,
      currency: "ars",
      date: "2026-03-01",
    } as any);
    expect(created).toMatchObject({
      name: "Hipoteca",
      currency: "ARS",
      assetId: null,
    });
  });

  it("updates and archives a debt", async () => {
    const { service, repository } = build();
    repository.findOneBy.mockResolvedValue(debt());

    const updated = await service.updateDebt("u1", "d1", {
      balance: 500,
      assetId: "asset-1",
    } as any);
    expect(updated.balance).toBe(500);
    expect(updated.assetId).toBe("asset-1");

    expect((await service.archiveDebt("u1", "d1")).archived).toBe(true);
  });

  it("throws NOT_FOUND for an unknown debt", async () => {
    const { service, repository } = build();
    repository.findOneBy.mockResolvedValue(null);
    await expect(
      service.updateDebt("u1", "x", {} as any),
    ).rejects.toMatchObject({
      response: { code: ErrorCode.NOT_FOUND },
    });
  });

  it("creates with an asset link and updates every field", async () => {
    const { service, repository } = build();
    const created = await service.createDebt("u1", {
      name: "H",
      type: "loan",
      balance: 1,
      currency: "ARS",
      date: "2026-03-01",
      assetId: "asset-1",
    } as any);
    expect(created.assetId).toBe("asset-1");

    repository.findOneBy.mockResolvedValue(debt());
    const updated = await service.updateDebt("u1", "d1", {
      name: "N",
      type: "loan",
      currency: "usd",
      date: "2026-04-01",
      assetId: null,
    } as any);
    expect(updated).toMatchObject({
      name: "N",
      currency: "USD",
      assetId: null,
    });
  });
});

describe("DebtsOrchestrator", () => {
  const build = () => {
    const debtsService = {
      listDebts: jest.fn(),
      createDebt: jest.fn(async (_u: string, dto: unknown) => dto),
      updateDebt: jest.fn(async (_u: string, _i: string, dto: unknown) => dto),
      archiveDebt: jest.fn(),
    };
    const assetsService = {
      assertOwnedAsset: jest.fn(async () => undefined),
    };
    const orchestrator = new DebtsOrchestrator(
      debtsService as any,
      assetsService as any,
    );
    return { orchestrator, debtsService, assetsService };
  };

  it("validates the linked asset before creating and updating", async () => {
    const { orchestrator, assetsService, debtsService } = build();

    await orchestrator.createDebt("u1", { assetId: "asset-1" } as any);
    await orchestrator.updateDebt("u1", "d1", { assetId: "asset-1" } as any);

    expect(assetsService.assertOwnedAsset).toHaveBeenCalledWith(
      "u1",
      "asset-1",
    );
    expect(debtsService.createDebt).toHaveBeenCalled();
    expect(debtsService.updateDebt).toHaveBeenCalled();
  });

  it("skips asset validation when there is no link", async () => {
    const { orchestrator, assetsService } = build();
    await orchestrator.createDebt("u1", {} as any);
    await orchestrator.updateDebt("u1", "d1", { assetId: null } as any);
    expect(assetsService.assertOwnedAsset).not.toHaveBeenCalled();
  });
});
