import type { TransactionType } from "../../common/types/financial-enums";

export interface MoneyTransaction {
  /** Signed for transfers; income/expense store a positive amount. */
  type: TransactionType;
  amount: number;
  date: string;
  accountId: string;
  transferAccountId: string | null;
  categoryId: string | null;
}

export interface BalanceAccount {
  id: string;
  initialBalance: number;
}

export interface PeriodFlows {
  income: number;
  expenses: number;
  savings: number;
}
