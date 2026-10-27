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
  primaryCurrency: string;
  createdAt: string;
}

export interface AuthResponse {
  user: User;
}

export interface Account {
  id: string;
  name: string;
  type: AccountType;
  currency: string;
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
  isSystem: boolean;
}

export interface CreateCategoryInput {
  name: string;
  type: CategoryType;
  color: string;
}

export type UpdateCategoryInput = Partial<
  Pick<CreateCategoryInput, "name" | "color">
>;

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

export interface DashboardBreakdown {
  currency: string;
  balance: number;
  accounts: number;
  /** Equivalent in the primary currency. */
  converted: number;
}

export interface DashboardRate {
  currency: string;
  /** How many units of the primary currency one unit buys. */
  rate: number;
  rateDate: string;
}

export interface DashboardData {
  period: PeriodRange;
  /** Currency scope of the period indicators and charts. */
  currency: string;
  /** Currency in which net worth is reported. */
  primaryCurrency: string;
  rateDate: string | null;
  availableCurrencies: string[];
  breakdown: DashboardBreakdown[];
  rates: DashboardRate[];
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
  incomeExpenseByPeriod: {
    bucket: "week" | "month";
    start: string;
    end: string;
    income: number;
    expenses: number;
  }[];
  incomeExpenseByMonth: { month: string; income: number; expenses: number }[];
  expensesByCategory: {
    categoryId: string;
    name: string;
    color: string;
    value: number;
  }[];
}

export interface CurrencyCatalogItem {
  code: string;
  name: string;
  symbol: string;
  decimals: number;
}

export type CurrencyRateSource = "api";

export interface CurrencyRate {
  currency: string;
  name: string;
  symbol: string;
  /** How many units of the user's primary currency one unit buys. */
  rate: number;
  rateDate: string;
  source: CurrencyRateSource;
}

export interface CurrencySettings {
  primaryCurrency: string;
  rates: CurrencyRate[];
  updatedAt: string | null;
}

export interface AssistantHistoryMessage {
  role: "user" | "assistant";
  content: string;
}

export interface AssistantMessageInput {
  question: string;
  period?: PeriodRange;
  currency?: string;
  /** Turnos previos de la conversación en memoria, para preguntas de seguimiento. */
  history?: AssistantHistoryMessage[];
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
  primaryCurrency: string;
}

export interface UpdateUserInput {
  name?: string;
  email?: string;
  primaryCurrency?: string;
}

export interface ChangePasswordInput {
  currentPassword: string;
  newPassword: string;
}

export interface CreateAccountInput {
  name: string;
  type: AccountType;
  currency: string;
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
  transferAmount?: number;
  categoryId?: string | null;
}

export type UpdateTransactionInput = Partial<CreateTransactionInput>;

export interface TransactionListQuery {
  page?: number;
  pageSize?: number;
}
