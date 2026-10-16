export type AccountType = "cash" | "bank" | "wallet" | "other";
export type TransactionType = "income" | "expense" | "transfer";
export type CategoryType = "income" | "expense";

export interface Paginated<T> {
  items: T[];
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
}

export interface ApiError {
  statusCode: number;
  code: string;
  message: string;
  fieldErrors?: Record<string, string[]>;
}

export interface PeriodRange {
  from: string;
  to: string;
}

export interface User {
  id: string;
  name: string;
  email: string;
  createdAt: string;
}

export interface AuthResponse {
  user: User;
  accessToken: string;
  refreshToken: string;
}

export interface Account {
  id: string;
  name: string;
  type: AccountType;
  initialBalance: number;
  currentBalance: number;
  notes: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface Category {
  id: string;
  name: string;
  type: CategoryType;
  color: string;
  icon: string | null;
}

export interface Transaction {
  id: string;
  type: TransactionType;
  amount: number;
  date: string;
  description: string;
  notes: string | null;
  accountId: string;
  transferAccountId: string | null;
  categoryId: string | null;
  transferGroupId: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface DashboardData {
  period: PeriodRange;
  currency: string;
  kpis: {
    netWorth: number;
    netWorthDeltaPct: number | null;
    income: number;
    incomeDeltaPct: number | null;
    expenses: number;
    expensesDeltaPct: number | null;
    savings: number;
    savingsDeltaPct: number | null;
    savingsRateDeltaPp: number | null;
  };
  netWorthSeries: { date: string; value: number }[];
  incomeExpenseByMonth: { month: string; income: number; expenses: number }[];
  expensesByCategory: {
    categoryId: string;
    name: string;
    color: string;
    value: number;
  }[];
}

export interface AssistantMessageInput {
  question: string;
  period?: PeriodRange;
}

/* ── Inputs (mirror the REST request DTOs) ─────────────────────────────── */

export interface LoginInput {
  email: string;
  password: string;
}

export interface RegisterInput {
  name: string;
  email: string;
  password: string;
}

export interface UpdateUserInput {
  name?: string;
}

export interface CreateAccountInput {
  name: string;
  type: AccountType;
  initialBalance?: number;
  notes?: string | null;
}

export type UpdateAccountInput = Partial<
  Omit<CreateAccountInput, "initialBalance">
> & {
  initialBalance?: number;
};

export interface CreateTransactionInput {
  type: TransactionType;
  amount: number;
  date: string;
  description: string;
  notes?: string | null;
  accountId: string;
  transferAccountId?: string | null;
  categoryId?: string | null;
}

export type UpdateTransactionInput = Partial<CreateTransactionInput>;

export interface TransactionListQuery {
  page?: number;
  pageSize?: number;
}
