import { ErrorCode } from "../common/errors/error-codes";
import { AssistantContextService } from "./assistant-context.service";

const build = () => {
  const usersService = {
    getById: jest.fn().mockResolvedValue({ baseCurrency: "ARS" }),
  };
  const dashboardOrchestrator = {
    getDashboard: jest.fn().mockResolvedValue({
      period: { from: "2026-03-01", to: "2026-03-31" },
      currency: "ARS",
      kpis: {
        income: 1000,
        expenses: 400,
        savings: 600,
        netWorth: 4000,
        assets: 5000,
        debts: 2000,
      },
      expensesByCategory: [
        { categoryId: "c2", name: "Comida", color: "#000", value: 400 },
      ],
      incomeExpenseByMonth: [{ month: "2026-03", income: 1000, expenses: 400 }],
      investments: { positions: [{ id: "p1" }] },
    }),
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

  const service = new AssistantContextService(
    usersService as any,
    dashboardOrchestrator as any,
    budgetsOrchestrator as any,
  );
  return { service, dashboardOrchestrator, budgetsOrchestrator };
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
    const { service, dashboardOrchestrator, budgetsOrchestrator } = build();
    dashboardOrchestrator.getDashboard.mockResolvedValue({
      period: { from: "2026-03-01", to: "2026-03-31" },
      currency: "ARS",
      kpis: {
        income: 0,
        expenses: 0,
        savings: 0,
        netWorth: 0,
        assets: 0,
        debts: 0,
      },
      expensesByCategory: [],
      incomeExpenseByMonth: [],
      investments: { positions: [] },
    });
    budgetsOrchestrator.listBudgets.mockResolvedValue([]);

    const context = await service.build("u1", {} as any);
    expect(context.period.from).toBeDefined();
    expect(context.sources).not.toContain("budgets");
    expect(context.summary).toContain("Sin presupuestos definidos para el mes");
  });

  it("rejects an inverted period", async () => {
    const { service, dashboardOrchestrator } = build();
    await expect(
      service.build("u1", {
        period: { from: "2026-04-01", to: "2026-03-01" },
      } as any),
    ).rejects.toMatchObject({ response: { code: ErrorCode.VALIDATION_ERROR } });
    expect(dashboardOrchestrator.getDashboard).not.toHaveBeenCalled();
  });
});
