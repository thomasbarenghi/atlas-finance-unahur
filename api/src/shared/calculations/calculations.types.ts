import type {
  BudgetStatus,
  GoalStatus,
  TransactionType,
} from "../../common/types/financial-enums";

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
  archived: boolean;
}

export interface ValuationPoint {
  assetId: string;
  value: number;
  date: string;
}

export interface PositionCost {
  archived: boolean;
  quantity: number;
  avgCost: number;
}

export interface PeriodFlows {
  income: number;
  expenses: number;
  savings: number;
}

export interface BudgetConsumption {
  limit: number;
  spent: number;
  available: number;
  consumedPct: number;
  status: BudgetStatus;
}

export interface NetWorthParts {
  assets: number;
  positions: number;
  cash: number;
  debts: number;
}

export interface GoalProgress {
  progressPct: number;
  status: GoalStatus;
}
