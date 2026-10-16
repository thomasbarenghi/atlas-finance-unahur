import { Injectable } from "@nestjs/common";
import type {
  BalanceAccount,
  MoneyTransaction,
  PeriodFlows,
} from "./calculations.types";

const FULL_MONTH_END = "-31";

const toIsoDate = (date: Date): string => date.toISOString().slice(0, 10);

/**
 * Single source of truth for the financial formulas of the v0.3 scope
 * (CAL-001..003 y CAL-010, backend.md §8). Dashboard and the AI reuse it so a
 * formula never gets duplicated (AGENTS rule 7).
 */
@Injectable()
export class CalculationsService {
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

  /** CAL-001: patrimonio neto = Σ saldos netos de las cuentas del usuario. */
  calculateNetWorth(
    accounts: BalanceAccount[],
    transactions: MoneyTransaction[],
  ): number {
    return accounts.reduce(
      (total, account) =>
        total + this.calculateCurrentBalance(account, transactions),
      0,
    );
  }

  pctDelta(current: number, previous: number): number | null {
    if (previous === 0) return null;
    return ((current - previous) / Math.abs(previous)) * 100;
  }

  monthRange(from: string, to: string): string[] {
    const months: string[] = [];
    const cursor = new Date(`${from.slice(0, 7)}-01T00:00:00.000Z`);
    const end = new Date(`${to.slice(0, 7)}-01T00:00:00.000Z`);
    while (cursor <= end) {
      months.push(toIsoDate(cursor).slice(0, 7));
      cursor.setUTCMonth(cursor.getUTCMonth() + 1);
    }
    return months;
  }

  previousRange(from: string, to: string): { from: string; to: string } {
    const start = new Date(`${from}T00:00:00.000Z`);
    const end = new Date(`${to}T00:00:00.000Z`);
    const days = Math.max(
      1,
      Math.round((end.getTime() - start.getTime()) / 86_400_000) + 1,
    );
    const previousEnd = new Date(start);
    previousEnd.setUTCDate(previousEnd.getUTCDate() - 1);
    const previousStart = new Date(previousEnd);
    previousStart.setUTCDate(previousStart.getUTCDate() - (days - 1));
    return { from: toIsoDate(previousStart), to: toIsoDate(previousEnd) };
  }

  monthEnd(month: string): string {
    const [year, monthNumber] = month.split("-").map(Number);
    const lastDay = new Date(Date.UTC(year, monthNumber, 0)).getUTCDate();
    return `${month}-${String(lastDay).padStart(2, "0")}`;
  }
}
