import { ConfigService } from "@nestjs/config";
import { AppConfig } from "../config/configuration";
import { ErrorCode } from "../common/errors/error-codes";
import { CalculationsService } from "../shared/calculations/calculations.service";
import { AssistantContextService } from "./assistant-context.service";

const calculations = new CalculationsService({
  get: jest.fn(() => 0.8),
} as unknown as ConfigService<AppConfig, true>);

const build = () => {
  const usersService = {
    getById: jest.fn().mockResolvedValue({ baseCurrency: "ARS" }),
  };
  const transactionsService = {
    listOwnedTransactions: jest.fn().mockResolvedValue([
      { type: "income", amount: 1000, date: "2026-03-05", categoryId: "c1" },
      { type: "expense", amount: 400, date: "2026-03-10", categoryId: "c2" },
    ]),
  };
  const categoriesService = {
    listCategories: jest.fn().mockResolvedValue([
      { id: "c1", name: "Sueldo" },
      { id: "c2", name: "Comida" },
    ]),
  };
  const budgetsOrchestrator = {
    listBudgets: jest.fn().mockResolvedValue([
      {
        category: { name: "Comida" },
        limit: 1000,
        spent: 400,
        consumedPct: 40,
      },
    ]),
  };
  const accountsService = {
    listOwnedAccounts: jest
      .fn()
      .mockResolvedValue([
        { id: "a1", initialBalance: 1000, currency: "ARS", archived: false },
      ]),
  };
  const assetsService = {
    listOwnedAssets: jest
      .fn()
      .mockResolvedValue([{ id: "asset-1", archived: false }]),
    listValuationsForUser: jest.fn().mockResolvedValue([
      {
        assetId: "asset-1",
        value: 5000,
        currency: "ARS",
        date: "2026-03-01",
      },
    ]),
  };
  const debtsService = {
    listOwnedDebts: jest
      .fn()
      .mockResolvedValue([{ balance: 2000, archived: false }]),
  };
  const positionsService = {
    listOwnedPositions: jest
      .fn()
      .mockResolvedValue([{ archived: false, quantity: 1, avgCost: 100 }]),
  };

  const service = new AssistantContextService(
    usersService as any,
    transactionsService as any,
    categoriesService as any,
    budgetsOrchestrator as any,
    accountsService as any,
    assetsService as any,
    debtsService as any,
    positionsService as any,
    calculations,
  );
  return { service, transactionsService, budgetsOrchestrator, assetsService };
};

describe("AssistantContextService", () => {
  it("builds a minimal pre-calculated context with sources", async () => {
    const { service } = build();
    const context = await service.build("u1", {
      period: { from: "2026-03-01", to: "2026-03-31" },
    } as any);

    expect(context.period).toEqual({ from: "2026-03-01", to: "2026-03-31" });
    expect(context.currency).toBe("ARS");
    expect(context.sources).toEqual(
      expect.arrayContaining([
        "transactions",
        "budgets",
        "assets",
        "debts",
        "positions",
      ]),
    );
    expect(context.summary).toContain("Ingresos del período: 1000");
    expect(context.summary).toContain("Comida");
  });

  it("defaults the period and omits empty sources", async () => {
    const { service, assetsService, budgetsOrchestrator } = build();
    assetsService.listOwnedAssets.mockResolvedValue([]);
    budgetsOrchestrator.listBudgets.mockResolvedValue([]);

    const context = await service.build("u1", {} as any);
    expect(context.period.from).toBeDefined();
    expect(context.sources).not.toContain("budgets");
    expect(context.summary).toContain("Sin presupuestos definidos para el mes");
  });

  it("rejects an inverted period", async () => {
    const { service } = build();
    await expect(
      service.build("u1", {
        period: { from: "2026-04-01", to: "2026-03-01" },
      } as any),
    ).rejects.toMatchObject({ response: { code: ErrorCode.VALIDATION_ERROR } });
  });
});
