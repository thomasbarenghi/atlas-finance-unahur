import { del, get, patch, post } from "./client";
import type {
  Account,
  AuthResponse,
  Category,
  CreateAccountInput,
  CreateCategoryInput,
  CreateTransactionInput,
  DashboardData,
  LoginInput,
  Paginated,
  RegisterInput,
  Transaction,
  TransactionListQuery,
  UpdateAccountInput,
  UpdateCategoryInput,
  UpdateTransactionInput,
  UpdateUserInput,
  User,
} from "./types";

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
    post<AuthResponse>("/auth/login", input),
  register: (input: RegisterInput): Promise<AuthResponse> =>
    post<AuthResponse>("/auth/register", input),
  logout: (): Promise<void> => post<void>("/auth/logout"),
  me: (): Promise<User> => get<User>("/auth/me"),
};

export const userEndpoints = {
  updateMe: (input: UpdateUserInput): Promise<User> =>
    patch<User>("/users/me", input),
};

export const accountEndpoints = {
  list: (): Promise<Account[]> => get<Account[]>("/accounts"),
  create: (input: CreateAccountInput): Promise<Account> =>
    post<Account>("/accounts", input),
  update: (id: string, input: UpdateAccountInput): Promise<Account> =>
    patch<Account>(`/accounts/${id}`, input),
  remove: (id: string): Promise<void> => del<void>(`/accounts/${id}`),
};

export const categoryEndpoints = {
  list: (): Promise<Category[]> => get<Category[]>("/categories"),
  create: (input: CreateCategoryInput): Promise<Category> =>
    post<Category>("/categories", input),
  update: (id: string, input: UpdateCategoryInput): Promise<Category> =>
    patch<Category>(`/categories/${id}`, input),
  remove: (id: string): Promise<void> => del<void>(`/categories/${id}`),
};

export const transactionEndpoints = {
  list: (params: TransactionListQuery = {}): Promise<Paginated<Transaction>> =>
    get<Paginated<Transaction>>(`/transactions${query(params)}`),
  create: (input: CreateTransactionInput): Promise<Transaction> =>
    post<Transaction>("/transactions", input),
  update: (id: string, input: UpdateTransactionInput): Promise<Transaction> =>
    patch<Transaction>(`/transactions/${id}`, input),
  remove: (id: string): Promise<void> => del<void>(`/transactions/${id}`),
};

export const dashboardEndpoints = {
  get: (params: { from: string; to: string }): Promise<DashboardData> =>
    get<DashboardData>(`/dashboard${query(params)}`),
};
