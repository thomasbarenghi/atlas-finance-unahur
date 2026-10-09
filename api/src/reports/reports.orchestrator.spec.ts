import { ReportsOrchestrator } from "./reports.orchestrator";

const build = () => {
  const dashboardOrchestrator = {
    getDashboard: jest.fn().mockResolvedValue({
      period: { from: "2026-01-01", to: "2026-03-31" },
      currency: "ARS",
      kpis: { income: 500, expenses: 200, savings: 300, netWorth: 1300 },
      netWorthSeries: [{ date: "2026-03-31", value: 1300 }],
      investments: { totalValue: 0 },
    }),
  };
  const budgetsOrchestrator = {
    listBudgets: jest.fn().mockResolvedValue([
      {
        id: "b1",
        category: { name: "Comida" },
        limit: 1000,
        spent: 200,
        consumedPct: 20,
        status: "available",
      },
    ]),
  };
  const transactionsService = {
    listOwnedTransactions: jest.fn().mockResolvedValue([
      {
        type: "income",
        amount: 500,
        currency: "ARS",
        date: "2026-03-05",
        categoryId: "c1",
        description: "Sueldo",
        accountId: "a1",
        transferAccountId: null,
        notes: null,
      },
      {
        type: "expense",
        amount: 200,
        currency: "ARS",
        date: "2026-03-10",
        categoryId: "c2",
        description: 'Cena, "especial"\nlinea2',
        accountId: "a1",
        transferAccountId: null,
        notes: null,
      },
      {
        type: "transfer",
        amount: -100,
        currency: "ARS",
        date: "2026-03-15",
        categoryId: null,
        description: "Transf",
        accountId: "a1",
        transferAccountId: "a2",
        notes: null,
      },
    ]),
  };
  const categoriesService = {
    listCategories: jest.fn().mockResolvedValue([
      { id: "c1", name: "Sueldo" },
      { id: "c2", name: "Comida" },
    ]),
  };
  const usersService = {
    getById: jest.fn().mockResolvedValue({ baseCurrency: "ARS" }),
  };
  const fxService = {
    getConverter: jest.fn(async () => (amount: number) => amount),
  };

  const orchestrator = new ReportsOrchestrator(
    dashboardOrchestrator as any,
    budgetsOrchestrator as any,
    transactionsService as any,
    categoriesService as any,
    usersService as any,
    fxService as any,
  );
  return {
    orchestrator,
    dashboardOrchestrator,
    budgetsOrchestrator,
    transactionsService,
  };
};

const QUERY = { from: "2026-01-01", to: "2026-03-31" };

describe("ReportsOrchestrator", () => {
  it("builds the period summary from the dashboard", async () => {
    const { orchestrator } = build();
    await expect(orchestrator.summary("u1", QUERY as any)).resolves.toEqual({
      from: "2026-01-01",
      to: "2026-03-31",
      currency: "ARS",
      income: 500,
      expenses: 200,
      savings: 300,
      netWorth: 1300,
    });
  });

  it("breaks down income/expense by category with percentages", async () => {
    const { orchestrator } = build();
    const rows = await orchestrator.byCategory("u1", QUERY as any);

    expect(rows).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          name: "Sueldo",
          type: "income",
          value: 500,
          pct: 100,
        }),
        expect.objectContaining({
          name: "Comida",
          type: "expense",
          value: 200,
          pct: 100,
        }),
      ]),
    );
    // transfers are excluded
    expect(rows.find((r) => r.name === "Transf")).toBeUndefined();
  });

  it("maps the net-worth series", async () => {
    const { orchestrator } = build();
    await expect(orchestrator.netWorth("u1", QUERY as any)).resolves.toEqual([
      { date: "2026-03-31", netWorth: 1300 },
    ]);
  });

  it("labels uncategorized expenses and income", async () => {
    const { orchestrator, transactionsService } = build();
    transactionsService.listOwnedTransactions.mockResolvedValue([
      {
        type: "expense",
        amount: 10,
        currency: "ARS",
        date: "2026-03-01",
        categoryId: null,
        description: "x",
        accountId: "a1",
        transferAccountId: null,
        notes: null,
      },
      {
        type: "income",
        amount: 20,
        currency: "ARS",
        date: "2026-03-02",
        categoryId: null,
        description: "y",
        accountId: "a1",
        transferAccountId: null,
        notes: null,
      },
    ]);
    const rows = await orchestrator.byCategory("u1", QUERY as any);
    expect(rows).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ name: "Sin categoría", type: "expense" }),
        expect.objectContaining({ name: "Otros ingresos", type: "income" }),
      ]),
    );
  });

  it("maps budget compliance rows", async () => {
    const { orchestrator } = build();
    await expect(orchestrator.budgets("u1", "2026-03")).resolves.toEqual([
      {
        budgetId: "b1",
        categoryName: "Comida",
        limit: 1000,
        spent: 200,
        consumedPct: 20,
        status: "available",
      },
    ]);
  });

  it("returns the investments block", async () => {
    const { orchestrator } = build();
    await expect(orchestrator.investments("u1", QUERY as any)).resolves.toEqual(
      {
        totalValue: 0,
      },
    );
  });

  it("exports a summary CSV", async () => {
    const { orchestrator } = build();
    const csv = await orchestrator.exportCsv("u1", QUERY as any, "summary");
    expect(csv).toContain("Patrimonio neto,1300");
  });

  it("exports transactions as CSV escaping special characters", async () => {
    const { orchestrator } = build();
    const csv = await orchestrator.exportCsv(
      "u1",
      QUERY as any,
      "transactions",
    );
    const lines = csv.split("\n");
    expect(lines[0]).toContain("Fecha,Tipo,Descripcion");
    expect(csv).toContain('"Cena, ""especial""\nlinea2"');
    // the transfer outside the range is filtered out
    const outside = await orchestrator.exportCsv(
      "u1",
      { from: "2026-04-01", to: "2026-04-30" } as any,
      "transactions",
    );
    expect(outside.split("\n")).toHaveLength(1); // header only
  });
});
