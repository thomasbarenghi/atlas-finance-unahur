import { Injectable } from "@nestjs/common";
import type {
  BalanceAccount,
  MoneyTransaction,
  PeriodFlows,
} from "./calculations.types";

const toIsoDate = (date: Date): string => date.toISOString().slice(0, 10);

/**
 * Single source of truth for the financial formulas of the v0.3 scope
 * (CAL-001..003 y CAL-010, backend.md §8). Dashboard and the AI reuse it so a
 * formula never gets duplicated (AGENTS rule 7).
 */
export const signedAmount = (
  transaction: Pick<MoneyTransaction, "type" | "amount">,
): number =>
  transaction.type === "expense" ? -transaction.amount : transaction.amount;

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

  /**
   * Account balance at the end of `end` (inclusive). With no `end`, it is the
   * current balance. Used for CAL-001 both today and at past month ends.
   */
  balanceAt(
    account: BalanceAccount,
    transactions: MoneyTransaction[],
    end?: string,
  ): number {
    let balance = account.initialBalance;

    for (const transaction of transactions) {
      if (transaction.accountId !== account.id) continue;
      if (end && transaction.date > end) continue;
      balance += signedAmount(transaction);
    }

    return balance;
  }

  calculateCurrentBalance(
    account: BalanceAccount,
    transactions: MoneyTransaction[],
  ): number {
    return this.balanceAt(account, transactions);
  }

  /** CAL-001: patrimonio neto = Σ saldos netos de las cuentas del usuario. */
  netWorthAt(
    accounts: BalanceAccount[],
    transactions: MoneyTransaction[],
    end?: string,
  ): number {
    return accounts.reduce(
      (total, account) => total + this.balanceAt(account, transactions, end),
      0,
    );
  }

  calculateNetWorth(
    accounts: BalanceAccount[],
    transactions: MoneyTransaction[],
  ): number {
    return this.netWorthAt(accounts, transactions);
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
