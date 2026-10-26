import { Injectable } from "@nestjs/common";
import type {
  BalanceAccount,
  MoneyTransaction,
  PeriodFlows,
  RateMap,
} from "./calculations.types";

const toIsoDate = (date: Date): string => date.toISOString().slice(0, 10);

/**
 * Single source of truth for the financial formulas of the v0.3 scope
 * (CAL-001..003 y CAL-010, backend.md §8). Dashboard and the AI reuse it so a
 * formula never gets duplicated (AGENTS rule 7).
 *
 * Multimoneda (v0.4): flows are always calculated for one currency at a time
 * (RN-018). Net worth is the only cross-currency aggregate; it converts each
 * account balance with the single quote from Settings (CAL-001).
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
    currency?: string,
  ): PeriodFlows {
    let income = 0;
    let expenses = 0;

    for (const transaction of transactions) {
      if (transaction.date < from || transaction.date > to) continue;
      if (currency && transaction.currency !== currency) continue;
      if (transaction.type === "income") income += transaction.amount;
      else if (transaction.type === "expense") expenses += transaction.amount;
    }

    return { income, expenses, savings: income - expenses };
  }

  calculateExpensesByCategory(
    transactions: MoneyTransaction[],
    from: string,
    to: string,
    currency?: string,
  ): Map<string, number> {
    const expensesByCategory = new Map<string, number>();

    for (const transaction of transactions) {
      if (transaction.type !== "expense" || !transaction.categoryId) continue;
      if (transaction.date < from || transaction.date > to) continue;
      if (currency && transaction.currency !== currency) continue;
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

  /**
   * Converts an amount using rates expressed in the same base (ARS per unit).
   * A missing rate falls back to 1 so a partially configured user never breaks
   * the page; the settings screen shows the quote and lets the user fix it.
   */
  convertAmount(
    value: number,
    from: string,
    to: string,
    rates: RateMap,
  ): number {
    if (from === to) return value;
    const fromRate = rates.get(from) ?? 1;
    const toRate = rates.get(to) ?? 1;
    if (!fromRate || !toRate) return value;
    return (value * fromRate) / toRate;
  }

  /**
   * CAL-001 multimoneda: Σ (saldo × cotización de Ajustes). The target is the
   * user's primary currency; historical points use the same current quote (the
   * design deliberately avoids a quote per movement).
   */
  netWorthInCurrency(
    accounts: BalanceAccount[],
    transactions: MoneyTransaction[],
    rates: RateMap,
    targetCurrency: string,
    end?: string,
  ): number {
    const targetRate = rates.get(targetCurrency) ?? 1;
    return accounts.reduce((total, account) => {
      const balance = this.balanceAt(account, transactions, end);
      const accountCurrency = account.currency ?? targetCurrency;
      const accountRate = rates.get(accountCurrency) ?? 1;
      return total + (balance * accountRate) / targetRate;
    }, 0);
  }

  pctDelta(current: number, previous: number): number | null {
    if (previous === 0) return null;
    return ((current - previous) / Math.abs(previous)) * 100;
  }

  dayRange(from: string, to: string): string[] {
    const days: string[] = [];
    const cursor = new Date(`${from}T00:00:00.000Z`);
    const end = new Date(`${to}T00:00:00.000Z`);
    while (cursor <= end) {
      days.push(toIsoDate(cursor));
      cursor.setUTCDate(cursor.getUTCDate() + 1);
    }
    return days;
  }

  weekRange(from: string, to: string): { start: string; end: string }[] {
    const weeks: { start: string; end: string }[] = [];
    const end = new Date(`${to}T00:00:00.000Z`);
    let cursor = new Date(`${from}T00:00:00.000Z`);
    while (cursor <= end) {
      const weekEnd = new Date(cursor);
      weekEnd.setUTCDate(weekEnd.getUTCDate() + 6);
      const capped = weekEnd > end ? end : weekEnd;
      weeks.push({ start: toIsoDate(cursor), end: toIsoDate(capped) });
      cursor = new Date(capped);
      cursor.setUTCDate(cursor.getUTCDate() + 1);
    }
    return weeks;
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
