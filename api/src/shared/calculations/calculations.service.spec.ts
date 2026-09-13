import { ConfigService } from "@nestjs/config";
import type { AppConfig } from "../../config/configuration";
import { CalculationsService } from "./calculations.service";
import type { MoneyTransaction } from "./calculations.types";

const buildService = (budgetWarningThreshold = 0.8): CalculationsService => {
  const config = {
    get: jest.fn().mockReturnValue(budgetWarningThreshold),
  } as unknown as ConfigService<AppConfig, true>;

  return new CalculationsService(config);
};

const transaction = (
  overrides: Partial<MoneyTransaction> = {},
): MoneyTransaction => ({
  type: "expense",
  amount: 100,
  date: "2026-03-10",
  accountId: "account-1",
  transferAccountId: null,
  categoryId: "category-1",
  ...overrides,
});

describe("CalculationsService", () => {
  describe("calculatePeriodFlows", () => {
    it("sums income and expenses and excludes transfers", () => {
      const service = buildService();
      const flows = service.calculatePeriodFlows(
        [
          transaction({ type: "income", amount: 1000 }),
          transaction({ type: "expense", amount: 400 }),
          transaction({ type: "transfer", amount: 5000 }),
          transaction({ type: "income", amount: 999, date: "2026-04-01" }),
        ],
        "2026-03-01",
        "2026-03-31",
      );

      expect(flows).toEqual({ income: 1000, expenses: 400, savings: 600 });
    });

    it("returns zeroes when there are no movements in the period", () => {
      const service = buildService();

      expect(
        service.calculatePeriodFlows([], "2026-03-01", "2026-03-31"),
      ).toEqual({ income: 0, expenses: 0, savings: 0 });
    });
  });

  describe("calculateMonthExpenses", () => {
    it("only counts expenses from the given month", () => {
      const service = buildService();

      const total = service.calculateMonthExpenses(
        [
          transaction({ amount: 100, date: "2026-03-31" }),
          transaction({ amount: 50, date: "2026-03-01" }),
          transaction({ amount: 999, date: "2026-02-28" }),
          transaction({ type: "income", amount: 5000, date: "2026-03-15" }),
        ],
        "2026-03",
      );

      expect(total).toBe(150);
    });
  });

  describe("calculateExpensesByCategory", () => {
    it("groups period expenses by category", () => {
      const service = buildService();

      const grouped = service.calculateExpensesByCategory(
        [
          transaction({ amount: 100, categoryId: "food" }),
          transaction({ amount: 50, categoryId: "food" }),
          transaction({ amount: 200, categoryId: "transport" }),
          transaction({ amount: 30, categoryId: null }),
          transaction({ amount: 70, categoryId: "food", date: "2026-04-02" }),
        ],
        "2026-03-01",
        "2026-03-31",
      );

      expect(grouped.get("food")).toBe(150);
      expect(grouped.get("transport")).toBe(200);
      expect(grouped.size).toBe(2);
    });
  });

  describe("calculateBudgetConsumption", () => {
    it("stays available below the warning threshold", () => {
      const service = buildService();

      const result = service.calculateBudgetConsumption(1000, 500);

      expect(result.status).toBe("available");
      expect(result.available).toBe(500);
      expect(result.consumedPct).toBe(50);
    });

    it("warns at or above the threshold without exceeding", () => {
      const service = buildService();

      expect(service.calculateBudgetConsumption(1000, 800).status).toBe(
        "warning",
      );
      expect(service.calculateBudgetConsumption(1000, 1000).status).toBe(
        "warning",
      );
    });

    it("is exceeded when spending passes the limit", () => {
      const service = buildService();

      const result = service.calculateBudgetConsumption(1000, 1200);

      expect(result.status).toBe("exceeded");
      expect(result.available).toBe(-200);
    });

    it("does not divide by zero for a limit-less budget", () => {
      const service = buildService();

      expect(service.calculateBudgetConsumption(0, 500)).toEqual({
        limit: 0,
        spent: 500,
        available: -500,
        consumedPct: 0,
        status: "available",
      });
    });
  });

  describe("calculateCurrentBalance", () => {
    it("applies income, expenses and both transfer legs", () => {
      const service = buildService();
      const account = { id: "a1", initialBalance: 1000, archived: false };

      const balance = service.calculateCurrentBalance(account, [
        transaction({ type: "income", amount: 200, accountId: "a1" }),
        transaction({ type: "expense", amount: 50, accountId: "a1" }),
        transaction({
          type: "transfer",
          amount: -300,
          accountId: "a1",
          transferAccountId: "a2",
        }),
        transaction({
          type: "transfer",
          amount: 100,
          accountId: "a1",
          transferAccountId: "a2",
        }),
      ]);

      expect(balance).toBe(950);
    });
  });

  describe("calculateCashBalance", () => {
    it("aggregates non-archived accounts and ignores archived ones", () => {
      const service = buildService();
      const accounts = [
        { id: "a1", initialBalance: 1000, archived: false },
        { id: "a2", initialBalance: 500, archived: true },
      ];

      expect(service.calculateCashBalance(accounts, [])).toBe(1000);
    });
  });

  describe("getLatestValuationsTotal", () => {
    it("keeps only the latest valuation per asset", () => {
      const service = buildService();

      const total = service.getLatestValuationsTotal([
        { assetId: "asset-1", value: 100, date: "2026-01-01" },
        { assetId: "asset-1", value: 150, date: "2026-03-01" },
        { assetId: "asset-2", value: 200, date: "2026-02-01" },
      ]);

      expect(total).toBe(350);
    });
  });

  describe("calculatePositionsCost", () => {
    it("multiplies quantity by average cost for active positions", () => {
      const service = buildService();

      const total = service.calculatePositionsCost([
        { archived: false, quantity: 2, avgCost: 100 },
        { archived: false, quantity: 1, avgCost: 50 },
        { archived: true, quantity: 10, avgCost: 100 },
      ]);

      expect(total).toBe(250);
    });
  });

  describe("calculateNetWorth", () => {
    it("adds assets, positions and cash minus debts", () => {
      const service = buildService();

      expect(
        service.calculateNetWorth({
          assets: 1000,
          positions: 500,
          cash: 300,
          debts: 200,
        }),
      ).toBe(1600);
    });
  });

  describe("calculateGoalProgress", () => {
    const reference = new Date("2026-09-12T00:00:00.000Z");

    it("computes the percentage without dividing by zero", () => {
      const service = buildService();

      expect(service.calculateGoalProgress(1000, 200, null, reference)).toEqual(
        {
          progressPct: 20,
          status: "in_progress",
        },
      );
      expect(service.calculateGoalProgress(0, 500, null, reference)).toEqual({
        progressPct: 0,
        status: "in_progress",
      });
    });

    it("marks a goal as pending when nothing was saved", () => {
      const service = buildService();

      expect(
        service.calculateGoalProgress(1000, 0, null, reference).status,
      ).toBe("pending");
    });

    it("marks a goal as achieved when the target is reached", () => {
      const service = buildService();

      expect(
        service.calculateGoalProgress(1000, 1000, "2026-12-01", reference)
          .status,
      ).toBe("achieved");
    });

    it("marks a goal as overdue after its target date", () => {
      const service = buildService();

      expect(
        service.calculateGoalProgress(1000, 200, "2026-01-01", reference)
          .status,
      ).toBe("overdue");
    });
  });
});
