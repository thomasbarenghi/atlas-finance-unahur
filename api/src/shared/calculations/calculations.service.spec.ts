import { CalculationsService } from "./calculations.service";
import type { MoneyTransaction } from "./calculations.types";

const service = new CalculationsService();

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
  describe("CAL-002 calculatePeriodFlows", () => {
    it("sums income and expenses and excludes transfers", () => {
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
      expect(
        service.calculatePeriodFlows([], "2026-03-01", "2026-03-31"),
      ).toEqual({ income: 0, expenses: 0, savings: 0 });
    });
  });

  describe("calculateExpensesByCategory", () => {
    it("groups period expenses by category and ignores uncategorized ones", () => {
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

  describe("CAL-001 calculateNetWorth", () => {
    it("sums the net balance of every account", () => {
      const accounts = [
        { id: "a1", initialBalance: 1000 },
        { id: "a2", initialBalance: 500 },
      ];

      const netWorth = service.calculateNetWorth(accounts, [
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
          amount: 300,
          accountId: "a2",
          transferAccountId: "a1",
        }),
      ]);

      expect(netWorth).toBe(1650);
    });

    it("returns zero with no accounts", () => {
      expect(service.calculateNetWorth([], [transaction()])).toBe(0);
    });
  });

  describe("calculateCurrentBalance", () => {
    it("applies income, expenses and both transfer legs", () => {
      const balance = service.calculateCurrentBalance(
        { id: "a1", initialBalance: 1000 },
        [
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
        ],
      );

      expect(balance).toBe(950);
    });
  });

  describe("balanceAt / netWorthAt", () => {
    it("only includes movements up to the end date", () => {
      const movements = [
        transaction({ type: "income", amount: 200, date: "2026-01-10" }),
        transaction({ type: "expense", amount: 50, date: "2026-03-10" }),
      ];

      expect(
        service.balanceAt({ id: "account-1", initialBalance: 1000 }, movements),
      ).toBe(1150);
      expect(
        service.balanceAt(
          { id: "account-1", initialBalance: 1000 },
          movements,
          "2026-01-31",
        ),
      ).toBe(1200);
    });

    it("sums every account at a date", () => {
      const accounts = [
        { id: "a1", initialBalance: 1000 },
        { id: "a2", initialBalance: 500 },
      ];
      const movements = [
        transaction({ type: "income", amount: 200, accountId: "a1" }),
        transaction({ type: "expense", amount: 50, accountId: "a1" }),
        transaction({
          type: "transfer",
          amount: -300,
          accountId: "a1",
          transferAccountId: "a2",
          date: "2026-04-01",
        }),
        transaction({
          type: "transfer",
          amount: 300,
          accountId: "a2",
          transferAccountId: "a1",
          date: "2026-04-01",
        }),
      ];

      expect(service.netWorthAt(accounts, movements, "2026-03-31")).toBe(1650);
      expect(service.netWorthAt(accounts, movements)).toBe(1650);
    });
  });

  describe("pctDelta", () => {
    it("computes the variation and returns null on a zero base", () => {
      expect(service.pctDelta(150, 100)).toBe(50);
      expect(service.pctDelta(50, 100)).toBe(-50);
      expect(service.pctDelta(10, 0)).toBeNull();
    });
  });

  describe("multimoneda (CAL-001/002)", () => {
    it("filters flows by the selected currency and never sums currencies", () => {
      const transactions = [
        transaction({ type: "income", amount: 100, currency: "ARS" }),
        transaction({ type: "income", amount: 10, currency: "USD" }),
        transaction({ type: "expense", amount: 40, currency: "USD" }),
      ];

      expect(
        service.calculatePeriodFlows(
          transactions,
          "2026-03-01",
          "2026-03-31",
          "ARS",
        ),
      ).toEqual({ income: 100, expenses: 0, savings: 100 });
      expect(
        service.calculatePeriodFlows(
          transactions,
          "2026-03-01",
          "2026-03-31",
          "USD",
        ),
      ).toEqual({ income: 10, expenses: 40, savings: -30 });
    });

    it("converts net worth with the single quote and supports another unit", () => {
      const accounts = [
        { id: "a1", initialBalance: 1000, currency: "ARS" },
        { id: "a2", initialBalance: 10, currency: "USD" },
      ];
      const rates = new Map([
        ["ARS", 1],
        ["USD", 1180],
      ]);

      expect(service.netWorthInCurrency(accounts, [], rates, "ARS")).toBe(
        12800,
      );
      expect(
        service.netWorthInCurrency(accounts, [], rates, "USD"),
      ).toBeCloseTo(12800 / 1180, 6);
    });
  });

  describe("period helpers", () => {
    it("lists the months in a range", () => {
      expect(service.monthRange("2026-01-15", "2026-03-02")).toEqual([
        "2026-01",
        "2026-02",
        "2026-03",
      ]);
    });

    it("computes the previous range of the same length", () => {
      expect(service.previousRange("2026-03-01", "2026-03-31")).toEqual({
        from: "2026-01-29",
        to: "2026-02-28",
      });
    });

    it("computes the end of the month", () => {
      expect(service.monthEnd("2026-02")).toBe("2026-02-28");
      expect(service.monthEnd("2026-04")).toBe("2026-04-30");
    });

    it("lists daily points and 7-day buckets", () => {
      expect(service.dayRange("2026-03-01", "2026-03-05")).toEqual([
        "2026-03-01",
        "2026-03-02",
        "2026-03-03",
        "2026-03-04",
        "2026-03-05",
      ]);
      expect(service.weekRange("2026-03-01", "2026-03-25")).toEqual([
        { start: "2026-03-01", end: "2026-03-07" },
        { start: "2026-03-08", end: "2026-03-14" },
        { start: "2026-03-15", end: "2026-03-21" },
        { start: "2026-03-22", end: "2026-03-25" },
      ]);
    });
  });
});
