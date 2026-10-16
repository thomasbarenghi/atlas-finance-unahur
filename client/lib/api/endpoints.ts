import { del, get, patch, post } from "./client";
import { mockApi } from "@/lib/mocks/api";
import type {
  Account,
  AuthResponse,
  Category,
  CreateAccountInput,
  CreateTransactionInput,
  DashboardData,
  LoginInput,
  Paginated,
  RegisterInput,
  Transaction,
  TransactionListQuery,
  UpdateAccountInput,
  UpdateTransactionInput,
  UpdateUserInput,
  User,
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
};

export const userEndpoints = {
  updateMe: (input: UpdateUserInput): Promise<User> =>
    USE_MOCKS ? mockApi.updateUser(input) : patch<User>("/users/me", input),
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
  remove: (id: string): Promise<void> =>
    USE_MOCKS ? mockApi.deleteAccount(id) : del<void>(`/accounts/${id}`),
};

export const categoryEndpoints = {
  list: (): Promise<Category[]> =>
    USE_MOCKS ? mockApi.listCategories() : get<Category[]>("/categories"),
};

export const transactionEndpoints = {
  list: (params: TransactionListQuery = {}): Promise<Paginated<Transaction>> =>
    USE_MOCKS
      ? mockApi.listTransactions(params)
      : get<Paginated<Transaction>>(`/transactions${query(params)}`),
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

export const dashboardEndpoints = {
  get: (params: { from: string; to: string }): Promise<DashboardData> =>
    USE_MOCKS
      ? mockApi.dashboard(params)
      : get<DashboardData>(`/dashboard${query(params)}`),
};
