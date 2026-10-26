import type { TransactionType } from "../../common/types/financial-enums";

export interface MoneyTransaction {
  /** Signed for transfers; income/expense store a positive amount. */
  type: TransactionType;
  amount: number;
  date: string;
  accountId: string;
  transferAccountId: string | null;
  categoryId: string | null;
  /** Currency of the account that owns the movement (derived, not stored). */
  currency?: string;
}

export interface BalanceAccount {
  id: string;
  initialBalance: number;
  /** Currency declared by the account (RN-015). */
  currency?: string;
}

export interface PeriodFlows {
  income: number;
  expenses: number;
  savings: number;
}

export type RateMap = Map<string, number>;
