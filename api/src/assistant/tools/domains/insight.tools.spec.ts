import { InsightTools } from "./insight.tools";

const build = () => {
  const dashboard = {
    getDashboard: jest.fn().mockResolvedValue({
      period: { from: "2026-03-01", to: "2026-03-31" },
      currency: "ARS",
      kpis: { netWorth: 1 },
      expensesByCategory: [],
      incomeExpenseByMonth: [],
      netWorthSeries: [],
      investments: {},
      budgetAlerts: [],
    }),
  };
  const reports = {
    summary: jest
      .fn()
      .mockResolvedValue({ from: "2026-03-01", to: "2026-03-31" }),
    byCategory: jest.fn().mockResolvedValue([{ name: "Comida" }]),
  };
  const quotes = {
    listQuotes: jest.fn().mockResolvedValue([{ symbol: "BTC" }]),
  };
  const tools = new InsightTools(
    dashboard as any,
    reports as any,
    quotes as any,
  );
  const byName = (name: string) =>
    tools.definitions().find((definition) => definition.name === name)!;
  return { byName, dashboard, reports, quotes };
};

describe("InsightTools", () => {
  it("returns the dashboard panel", async () => {
    const { byName, dashboard } = build();
    const result = await byName("getDashboard").execute!("u1", {
      from: "2026-03-01",
      to: "2026-03-31",
    });
    expect(dashboard.getDashboard).toHaveBeenCalledWith("u1", {
      from: "2026-03-01",
      to: "2026-03-31",
      currency: undefined,
    });
    expect(result.summary).toContain("2026-03-01");
  });

  it("returns the report summary", async () => {
    const { byName, reports } = build();
    const result = await byName("getReportSummary").execute!("u1", {});
    expect(reports.summary).toHaveBeenCalled();
    expect(result.summary).toContain("Resumen");
  });

  it("returns the report by category", async () => {
    const { byName, reports } = build();
    const result = await byName("getReportByCategory").execute!("u1", {});
    expect(reports.byCategory).toHaveBeenCalled();
    expect(result.summary).toContain("1 categoría");
  });

  it("lists quotes", async () => {
    const { byName, quotes } = build();
    const result = await byName("listQuotes").execute!("u1", {});
    expect(quotes.listQuotes).toHaveBeenCalled();
    expect(result.summary).toContain("1");
  });
});
