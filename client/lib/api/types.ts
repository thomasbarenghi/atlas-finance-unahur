export type AccountType =
  "cash" | "bank" | "wallet" | "card" | "other" | "goal";
export type TransactionType = "income" | "expense" | "transfer";
export type CategoryType = "income" | "expense";
export type AssetType =
  "property" | "vehicle" | "cash" | "investment" | "crypto" | "other";
export type DebtType = "loan" | "mortgage" | "card" | "other";
export type BudgetStatus = "available" | "warning" | "exceeded";
export type GoalStatus = "pending" | "in_progress" | "achieved" | "overdue";
export type Theme = "light" | "dark" | "system";
export type ValuationSource = "manual" | "market";

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
  baseCurrency: string;
  theme: Theme;
  aiEnabled: boolean;
  createdAt: string;
}

export interface AuthResponse {
  user: User;
  accessToken: string;
  refreshToken: string;
}

export interface CurrenciesResponse {
  default: string;
  supported: string[];
}

export interface Account {
  id: string;
  name: string;
  type: AccountType;
  currency: string;
  initialBalance: number;
  currentBalance: number;
  archived: boolean;
  notes: string | null;
  targetAmount: number | null;
  targetDate: string | null;
  sourceAccountId: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface Category {
  id: string;
  name: string;
  type: CategoryType;
  color: string;
  icon: string | null;
  archived: boolean;
  isSystem: boolean;
}

export interface Transaction {
  id: string;
  type: TransactionType;
  amount: number;
  currency: string;
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

export interface Budget {
  id: string;
  categoryId: string;
  category: Pick<Category, "id" | "name" | "color">;
  period: string;
  limit: number;
  currency: string;
  spent: number;
  available: number;
  consumedPct: number;
  status: BudgetStatus;
}

export interface Asset {
  id: string;
  name: string;
  type: AssetType;
  currency: string;
  currentValue: number;
  valuationDate: string;
  archived: boolean;
  notes: string | null;
  debtId: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface Valuation {
  id: string;
  assetId: string;
  value: number;
  currency: string;
  date: string;
  source: ValuationSource;
  createdAt: string;
}

export interface Debt {
  id: string;
  name: string;
  type: DebtType;
  balance: number;
  currency: string;
  date: string;
  archived: boolean;
  assetId: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface Position {
  id: string;
  symbol: string;
  instrument: string;
  quantity: number;
  avgCost: number;
  currency: string;
  currentPrice: number | null;
  currentValue: number | null;
  costBasis: number;
  profitLoss: number | null;
  profitLossPct: number | null;
  quoteDate: string | null;
  quoteProvider: string | null;
  isStale: boolean;
}

export interface Quote {
  symbol: string;
  price: number;
  currency: string;
  provider: string;
  change24h: number | null;
  fetchedAt: string;
  isStale: boolean;
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
    assets: number;
    debts: number;
  };
  netWorthSeries: { date: string; value: number }[];
  assetsValueByMonth: { month: string; value: number }[];
  incomeExpenseByMonth: {
    month: string;
    income: number;
    expenses: number;
  }[];
  expensesByCategory: {
    categoryId: string;
    name: string;
    color: string;
    value: number;
  }[];
  assetsComposition: { type: AssetType; value: number }[];
  cashflow: {
    income: { name: string; value: number }[];
    expenses: { name: string; color: string; value: number }[];
    savings: number;
  };
  investments: {
    totalValue: number;
    totalCost: number;
    profitLoss: number;
    profitLossPct: number;
    staleQuotes: number;
    positions: {
      symbol: string;
      instrument: string;
      value: number;
      profitLossPct: number | null;
      isStale: boolean;
    }[];
  };
  budgetAlerts: {
    budgetId: string;
    categoryName: string;
    consumedPct: number;
    status: BudgetStatus;
  }[];
}

export interface Conversation {
  id: string;
  question: string;
  answer: string;
  contextMeta: {
    period?: PeriodRange;
    currency?: string;
    sources?: string[];
  };
  createdAt: string;
}

export interface AssistantMessageInput {
  question: string;
  conversationId?: string | null;
  period?: PeriodRange;
  currency?: string;
}

export interface AssistantReply {
  conversationId: string;
  answer: string;
  insufficient: boolean;
  contextMeta: Conversation["contextMeta"];
}

export interface AssistantAudioInput {
  durationMs: number;
  transcript?: string;
  blob?: Blob;
  conversationId?: string | null;
  period?: PeriodRange;
  currency?: string;
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

export interface ForgotPasswordInput {
  email: string;
}

export interface ResetPasswordInput {
  token: string;
  password: string;
}

export interface UpdateUserInput {
  name?: string;
  baseCurrency?: string;
  theme?: Theme;
  aiEnabled?: boolean;
}

export interface CreateAccountInput {
  name: string;
  type: AccountType;
  currency: string;
  initialBalance: number;
  notes?: string | null;
  targetAmount?: number | null;
  targetDate?: string | null;
  sourceAccountId?: string | null;
}

export type UpdateAccountInput = Partial<
  Omit<CreateAccountInput, "initialBalance">
> & {
  initialBalance?: number;
};

export interface CreateCategoryInput {
  name: string;
  type: CategoryType;
  color: string;
  icon?: string | null;
}

export type UpdateCategoryInput = Partial<CreateCategoryInput>;

export interface CreateTransactionInput {
  type: TransactionType;
  amount: number;
  currency: string;
  date: string;
  description: string;
  notes?: string | null;
  accountId: string;
  transferAccountId?: string | null;
  categoryId?: string | null;
}

export type UpdateTransactionInput = Partial<CreateTransactionInput>;

export interface TransactionFilters {
  from?: string;
  to?: string;
  type?: TransactionType;
  accountId?: string;
  categoryId?: string;
  search?: string;
  page?: number;
  pageSize?: number;
}

export interface CreateBudgetInput {
  categoryId: string;
  period: string;
  limit: number;
  currency: string;
}

export type UpdateBudgetInput = Partial<
  Pick<CreateBudgetInput, "limit" | "currency">
>;

export interface CopyBudgetsInput {
  period: string;
  sourcePeriod?: string;
}

export interface CreateAssetInput {
  name: string;
  type: AssetType;
  currency: string;
  initialValue: number;
  date: string;
  notes?: string | null;
}

export type UpdateAssetInput = Partial<Omit<CreateAssetInput, "initialValue">>;

export interface CreateValuationInput {
  value: number;
  currency: string;
  date: string;
  source?: ValuationSource;
}

export interface CreateDebtInput {
  name: string;
  type: DebtType;
  balance: number;
  currency: string;
  date: string;
  assetId?: string | null;
}

export type UpdateDebtInput = Partial<CreateDebtInput>;

export interface CreatePositionInput {
  symbol: string;
  instrument: string;
  quantity: number;
  avgCost: number;
  currency: string;
}

export type UpdatePositionInput = Partial<CreatePositionInput>;
