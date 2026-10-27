import { ErrorCode } from "../common/errors/error-codes";
import { AssistantContextService } from "./assistant-context.service";

const build = () => {
  const dashboardOrchestrator = {
    getDashboard: jest.fn().mockResolvedValue({
      period: { from: "2026-03-01", to: "2026-03-31" },
      currency: "ARS",
      primaryCurrency: "ARS",
      breakdown: [
        { currency: "ARS", balance: 4000, accounts: 1, converted: 4000 },
      ],
      kpis: {
        income: 1000,
        expenses: 400,
        savings: 600,
        netWorth: 4000,
      },
      expensesByCategory: [
        { categoryId: "c2", name: "Comida", color: "#000", value: 400 },
      ],
      incomeExpenseByMonth: [{ month: "2026-03", income: 1000, expenses: 400 }],
      netWorthSeries: [{ date: "2026-03-31", value: 4000 }],
    }),
  };
  const accountsService = {
    listAccounts: jest.fn().mockResolvedValue([
      {
        id: "a1",
        name: "Banco",
        type: "bank",
        currency: "ARS",
        currentBalance: 4000,
      },
    ]),
  };

  const service = new AssistantContextService(
    dashboardOrchestrator as any,
    accountsService as any,
  );
  return { service, dashboardOrchestrator, accountsService };
};

describe("AssistantContextService", () => {
  it("builds a minimal pre-calculated context with sources", async () => {
    const { service } = build();
    const context = await service.build("u1", {
      period: { from: "2026-03-01", to: "2026-03-31" },
    } as any);

    expect(context.period).toEqual({ from: "2026-03-01", to: "2026-03-31" });
    expect(context.currency).toBe("ARS");
    expect(context.sources).toEqual([
      "transactions",
      "accounts",
      "categories",
      "currencies",
    ]);
    expect(context.summary).toContain("Ingresos del período (ARS): 1000 ARS");
    expect(context.summary).toContain(
      "Patrimonio neto actual en ARS: 4000 ARS",
    );
    expect(context.summary).toContain("se convierten a ARS antes de agregarse");
    expect(context.summary).toContain("Comida: 400 ARS");
    expect(context.summary).toContain("Banco (bank, ARS): 4000 ARS");
  });

  it("defaults the period and reports empty data clearly", async () => {
    const { service, dashboardOrchestrator, accountsService } = build();
    dashboardOrchestrator.getDashboard.mockResolvedValue({
      period: { from: "2026-03-01", to: "2026-03-31" },
      currency: "ARS",
      primaryCurrency: "ARS",
      breakdown: [],
      kpis: { income: 0, expenses: 0, savings: 0, netWorth: 0 },
      expensesByCategory: [],
      incomeExpenseByMonth: [],
      netWorthSeries: [],
    });
    accountsService.listAccounts.mockResolvedValue([]);

    const context = await service.build("u1", {} as any);
    expect(context.period.from).toBeDefined();
    expect(context.summary).toContain(
      "Sin gastos por categoría en el período.",
    );
    expect(context.summary).toContain("Sin cuentas.");
  });

  it("lets the dashboard validate an inverted period", async () => {
    const { service, dashboardOrchestrator } = build();
    dashboardOrchestrator.getDashboard.mockRejectedValue({
      response: { code: ErrorCode.VALIDATION_ERROR },
    });

    await expect(
      service.build("u1", {
        period: { from: "2026-04-01", to: "2026-03-01" },
      } as any),
    ).rejects.toMatchObject({ response: { code: ErrorCode.VALIDATION_ERROR } });
    expect(dashboardOrchestrator.getDashboard).toHaveBeenCalled();
  });
});
