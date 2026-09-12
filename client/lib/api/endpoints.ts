import { apiFetch, del, get, patch, post } from "./client";
import { mockApi } from "@/lib/mocks/api";
import type {
  Account,
  Asset,
  AssistantAudioInput,
  AssistantMessageInput,
  AssistantReply,
  AuthResponse,
  Budget,
  Category,
  Conversation,
  CopyBudgetsInput,
  CreateAccountInput,
  CreateAssetInput,
  CreateBudgetInput,
  CreateCategoryInput,
  CreateDebtInput,
  CreatePositionInput,
  CreateTransactionInput,
  CreateValuationInput,
  CurrenciesResponse,
  DashboardData,
  Debt,
  ForgotPasswordInput,
  LoginInput,
  Paginated,
  Position,
  Quote,
  RegisterInput,
  ResetPasswordInput,
  Transaction,
  TransactionFilters,
  UpdateAccountInput,
  UpdateAssetInput,
  UpdateBudgetInput,
  UpdateCategoryInput,
  UpdateDebtInput,
  UpdatePositionInput,
  UpdateTransactionInput,
  UpdateUserInput,
  User,
  Valuation,
} from "./types";

const USE_MOCKS = process.env.NEXT_PUBLIC_USE_MOCKS !== "false";

const query = (params: object): string => {
  const search = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (value !== undefined && value !== null && value !== "") {
      search.set(key, String(value));
    }
  }
  const serialized = search.toString();
  return serialized ? `?${serialized}` : "";
};

export const authEndpoints = {
  login: (input: LoginInput): Promise<AuthResponse> =>
    USE_MOCKS ? mockApi.login(input) : post<AuthResponse>("/auth/login", input),
  register: (input: RegisterInput): Promise<AuthResponse> =>
    USE_MOCKS
      ? mockApi.register(input)
      : post<AuthResponse>("/auth/register", input),
  logout: (): Promise<void> =>
    USE_MOCKS ? mockApi.logout() : post<void>("/auth/logout"),
  me: (): Promise<User> => (USE_MOCKS ? mockApi.me() : get<User>("/auth/me")),
  forgotPassword: (input: ForgotPasswordInput): Promise<void> =>
    USE_MOCKS
      ? mockApi.forgotPassword(input.email)
      : post<void>("/auth/forgot-password", input),
  resetPassword: (input: ResetPasswordInput): Promise<void> =>
    USE_MOCKS
      ? mockApi.resetPassword(input)
      : post<void>("/auth/reset-password", input),
};

export const userEndpoints = {
  updateMe: (input: UpdateUserInput): Promise<User> =>
    USE_MOCKS ? mockApi.updateUser(input) : patch<User>("/users/me", input),
};

export const referenceEndpoints = {
  currencies: (): Promise<CurrenciesResponse> =>
    USE_MOCKS
      ? mockApi.listCurrencies()
      : get<CurrenciesResponse>("/currencies"),
};

export const accountEndpoints = {
  list: (): Promise<Account[]> =>
    USE_MOCKS ? mockApi.listAccounts() : get<Account[]>("/accounts"),
  create: (input: CreateAccountInput): Promise<Account> =>
    USE_MOCKS
      ? mockApi.createAccount(input)
      : post<Account>("/accounts", input),
  update: (id: string, input: UpdateAccountInput): Promise<Account> =>
    USE_MOCKS
      ? mockApi.updateAccount(id, input)
      : patch<Account>(`/accounts/${id}`, input),
  archive: (id: string): Promise<Account> =>
    USE_MOCKS
      ? mockApi.archiveAccount(id)
      : post<Account>(`/accounts/${id}/archive`),
  restore: (id: string): Promise<Account> =>
    USE_MOCKS
      ? mockApi.restoreAccount(id)
      : post<Account>(`/accounts/${id}/restore`),
};

export const categoryEndpoints = {
  list: (): Promise<Category[]> =>
    USE_MOCKS ? mockApi.listCategories() : get<Category[]>("/categories"),
  create: (input: CreateCategoryInput): Promise<Category> =>
    USE_MOCKS
      ? mockApi.createCategory(input)
      : post<Category>("/categories", input),
  update: (id: string, input: UpdateCategoryInput): Promise<Category> =>
    USE_MOCKS
      ? mockApi.updateCategory(id, input)
      : patch<Category>(`/categories/${id}`, input),
  archive: (id: string): Promise<Category> =>
    USE_MOCKS
      ? mockApi.archiveCategory(id)
      : post<Category>(`/categories/${id}/archive`),
};

export const transactionEndpoints = {
  list: (filters: TransactionFilters = {}): Promise<Paginated<Transaction>> =>
    USE_MOCKS
      ? mockApi.listTransactions(filters)
      : get<Paginated<Transaction>>(`/transactions${query(filters)}`),
  create: (input: CreateTransactionInput): Promise<Transaction> =>
    USE_MOCKS
      ? mockApi.createTransaction(input)
      : post<Transaction>("/transactions", input),
  update: (id: string, input: UpdateTransactionInput): Promise<Transaction> =>
    USE_MOCKS
      ? mockApi.updateTransaction(id, input)
      : patch<Transaction>(`/transactions/${id}`, input),
  remove: (id: string): Promise<void> =>
    USE_MOCKS
      ? mockApi.deleteTransaction(id)
      : del<void>(`/transactions/${id}`),
};

export const budgetEndpoints = {
  list: (period?: string): Promise<Budget[]> =>
    USE_MOCKS
      ? mockApi.listBudgets(period)
      : get<Budget[]>(`/budgets${query({ period })}`),
  create: (input: CreateBudgetInput): Promise<Budget> =>
    USE_MOCKS ? mockApi.createBudget(input) : post<Budget>("/budgets", input),
  update: (id: string, input: UpdateBudgetInput): Promise<Budget> =>
    USE_MOCKS
      ? mockApi.updateBudget(id, input)
      : patch<Budget>(`/budgets/${id}`, input),
  remove: (id: string): Promise<void> =>
    USE_MOCKS ? mockApi.deleteBudget(id) : del<void>(`/budgets/${id}`),
  copyPrevious: (input: CopyBudgetsInput): Promise<Budget[]> =>
    USE_MOCKS
      ? mockApi.copyPreviousBudgets(input)
      : post<Budget[]>("/budgets/copy-previous", input),
};

export const assetEndpoints = {
  list: (): Promise<Asset[]> =>
    USE_MOCKS ? mockApi.listAssets() : get<Asset[]>("/assets"),
  create: (input: CreateAssetInput): Promise<Asset> =>
    USE_MOCKS ? mockApi.createAsset(input) : post<Asset>("/assets", input),
  update: (id: string, input: UpdateAssetInput): Promise<Asset> =>
    USE_MOCKS
      ? mockApi.updateAsset(id, input)
      : patch<Asset>(`/assets/${id}`, input),
  archive: (id: string): Promise<Asset> =>
    USE_MOCKS ? mockApi.archiveAsset(id) : post<Asset>(`/assets/${id}/archive`),
  valuations: (id: string): Promise<Valuation[]> =>
    USE_MOCKS
      ? mockApi.listValuations(id)
      : get<Valuation[]>(`/assets/${id}/valuations`),
  createValuation: (
    id: string,
    input: CreateValuationInput,
  ): Promise<Valuation> =>
    USE_MOCKS
      ? mockApi.createValuation(id, input)
      : post<Valuation>(`/assets/${id}/valuations`, input),
};

export const debtEndpoints = {
  list: (): Promise<Debt[]> =>
    USE_MOCKS ? mockApi.listDebts() : get<Debt[]>("/debts"),
  create: (input: CreateDebtInput): Promise<Debt> =>
    USE_MOCKS ? mockApi.createDebt(input) : post<Debt>("/debts", input),
  update: (id: string, input: UpdateDebtInput): Promise<Debt> =>
    USE_MOCKS
      ? mockApi.updateDebt(id, input)
      : patch<Debt>(`/debts/${id}`, input),
  archive: (id: string): Promise<Debt> =>
    USE_MOCKS ? mockApi.archiveDebt(id) : post<Debt>(`/debts/${id}/archive`),
};

export const positionEndpoints = {
  list: (): Promise<Position[]> =>
    USE_MOCKS ? mockApi.listPositions() : get<Position[]>("/positions"),
  create: (input: CreatePositionInput): Promise<Position> =>
    USE_MOCKS
      ? mockApi.createPosition(input)
      : post<Position>("/positions", input),
  update: (id: string, input: UpdatePositionInput): Promise<Position> =>
    USE_MOCKS
      ? mockApi.updatePosition(id, input)
      : patch<Position>(`/positions/${id}`, input),
  remove: (id: string): Promise<void> =>
    USE_MOCKS ? mockApi.deletePosition(id) : del<void>(`/positions/${id}`),
};

export const quoteEndpoints = {
  list: (): Promise<Quote[]> =>
    USE_MOCKS ? mockApi.listQuotes() : get<Quote[]>("/quotes"),
};

export const dashboardEndpoints = {
  get: (params: {
    from: string;
    to: string;
    currency?: string;
  }): Promise<DashboardData> =>
    USE_MOCKS
      ? mockApi.dashboard(params)
      : get<DashboardData>(`/dashboard${query(params)}`),
};

export const assistantEndpoints = {
  conversations: (): Promise<Conversation[]> =>
    USE_MOCKS
      ? mockApi.listConversations()
      : get<Conversation[]>("/assistant/conversations"),
  clearConversations: (): Promise<void> =>
    USE_MOCKS
      ? mockApi.deleteConversations()
      : del<void>("/assistant/conversations"),
  send: (input: AssistantMessageInput): Promise<AssistantReply> =>
    USE_MOCKS
      ? mockApi.sendMessage(input)
      : post<AssistantReply>("/assistant/messages", input),
  sendAudio: (input: AssistantAudioInput): Promise<AssistantReply> => {
    if (USE_MOCKS) return mockApi.sendAudioMessage(input);
    const formData = new FormData();
    if (input.blob) formData.append("audio", input.blob, "audio.webm");
    if (input.transcript) formData.append("transcript", input.transcript);
    if (input.conversationId) {
      formData.append("conversationId", input.conversationId);
    }
    if (input.period) {
      formData.append("from", input.period.from);
      formData.append("to", input.period.to);
    }
    if (input.currency) formData.append("currency", input.currency);
    formData.append("durationMs", String(input.durationMs));
    return apiFetch<AssistantReply>("/assistant/audio", {
      method: "POST",
      body: formData,
    });
  },
};
