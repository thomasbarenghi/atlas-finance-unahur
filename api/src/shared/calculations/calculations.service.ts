import { Injectable } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import type { BudgetStatus } from "../../common/types/financial-enums";
import { AppConfig } from "../../config/configuration";
import type {
  BalanceAccount,
  BudgetConsumption,
  MoneyTransaction,
  NetWorthParts,
  PeriodFlows,
  PositionCost,
  ValuationPoint,
} from "./calculations.types";

const FULL_MONTH_END = "-31";

@Injectable()
export class CalculationsService {
  constructor(private readonly config: ConfigService<AppConfig, true>) {}

  calculatePeriodFlows(
    transactions: MoneyTransaction[],
    from: string,
    to: string,
  ): PeriodFlows {
    let income = 0;
    let expenses = 0;

    for (const transaction of transactions) {
      if (transaction.date < from || transaction.date > to) continue;
      if (transaction.type === "income") income += transaction.amount;
      else if (transaction.type === "expense") expenses += transaction.amount;
    }

    return { income, expenses, savings: income - expenses };
  }

  calculateMonthExpenses(
    transactions: MoneyTransaction[],
    month: string,
  ): number {
    const flows = this.calculatePeriodFlows(
      transactions,
      `${month}-01`,
      `${month}${FULL_MONTH_END}`,
    );
    return flows.expenses;
  }

  calculateExpensesByCategory(
    transactions: MoneyTransaction[],
    from: string,
    to: string,
  ): Map<string, number> {
    const expensesByCategory = new Map<string, number>();

    for (const transaction of transactions) {
      if (transaction.type !== "expense" || !transaction.categoryId) continue;
      if (transaction.date < from || transaction.date > to) continue;
      expensesByCategory.set(
        transaction.categoryId,
        (expensesByCategory.get(transaction.categoryId) ?? 0) +
          transaction.amount,
      );
    }

    return expensesByCategory;
  }

  calculateBudgetConsumption(limit: number, spent: number): BudgetConsumption {
    const consumedPct = limit > 0 ? (spent / limit) * 100 : 0;
    const warningPct =
      this.config.get("budgetWarningThreshold", {
        infer: true,
      }) * 100;

    const status: BudgetStatus =
      limit <= 0
        ? "available"
        : consumedPct > 100
          ? "exceeded"
          : consumedPct >= warningPct
            ? "warning"
            : "available";

    return { limit, spent, available: limit - spent, consumedPct, status };
  }

  calculateCurrentBalance(
    account: BalanceAccount,
    transactions: MoneyTransaction[],
  ): number {
    let balance = account.initialBalance;

    for (const transaction of transactions) {
      if (transaction.accountId !== account.id) continue;
      if (transaction.type === "expense") balance -= transaction.amount;
      else balance += transaction.amount;
    }

    return balance;
  }

  calculateCashBalance(
    accounts: BalanceAccount[],
    transactions: MoneyTransaction[],
  ): number {
    return accounts
      .filter((account) => !account.archived)
      .reduce(
        (total, account) =>
          total + this.calculateCurrentBalance(account, transactions),
        0,
      );
  }

  getLatestValuationsTotal(valuations: ValuationPoint[]): number {
    const latestByAsset = new Map<string, ValuationPoint>();

    for (const valuation of valuations) {
      const current = latestByAsset.get(valuation.assetId);
      if (!current || valuation.date > current.date) {
        latestByAsset.set(valuation.assetId, valuation);
      }
    }

    let total = 0;
    for (const valuation of latestByAsset.values()) total += valuation.value;
    return total;
  }

  calculatePositionsCost(positions: PositionCost[]): number {
    return positions
      .filter((position) => !position.archived)
      .reduce(
        (total, position) => total + position.quantity * position.avgCost,
        0,
      );
  }

  calculateNetWorth({ assets, positions, cash, debts }: NetWorthParts): number {
    return assets + positions + cash - debts;
  }
}
