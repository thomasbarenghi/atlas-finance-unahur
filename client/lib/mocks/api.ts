import { ApiError } from "@/lib/api/client";
import { sessionStore } from "@/lib/api/session";
import { CURRENCY } from "@/lib/currency";
import { formatCurrency, formatPercent, toIsoDate } from "@/lib/format";
import type {
  Account,
  AssistantMessageInput,
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
} from "@/lib/api/types";
import {
  findUserByEmail,
  findUserRecord,
  mockId,
  mockState,
  signedAmount,
  type StoredAccount,
  type StoredTransaction,
} from "./store";

const DEFAULT_PAGE_SIZE = 20;
const MAX_PAGE_SIZE = 100;

export interface AssistantReply {
  answer: string;
  insufficient: boolean;
  currency: string;
  sources: string[];
  disclaimer: string;
}

const DISCLAIMER =
  "Información sobre tus propios datos. No constituye asesoramiento financiero.";

const delay = () =>
  new Promise<void>((resolve) => {
    setTimeout(resolve, 60);
  });

const fail: (
  statusCode: number,
  code: string,
  message: string,
  fieldErrors?: Record<string, string[]>,
) => never = (statusCode, code, message, fieldErrors) => {
  throw new ApiError({ statusCode, code, message, fieldErrors });
};

const requireUser = (): User => {
  const userId = sessionStore.getUserId();
  const record = userId ? findUserRecord(userId) : undefined;
  if (!record) {
    if (userId) sessionStore.clear();
    fail(401, "UNAUTHENTICATED", "Iniciá sesión para continuar");
  }
  return record.user;
};

const findOwnedAccount = (userId: string, accountId: string): Account => {
  const account = mockState.accounts.find(
    (item) => item.id === accountId && item.userId === userId,
  );
  if (!account) fail(404, "NOT_FOUND", "La cuenta no existe");
  return account;
};

const findOwnedCategory = (categoryId: string): Category | undefined =>
  mockState.categories.find((category) => category.id === categoryId);

const deriveAccount = (account: Account): Account => ({
  ...account,
  currentBalance: mockState.transactions
    .filter((transaction) => transaction.accountId === account.id)
    .reduce(
      (total, transaction) => total + signedAmount(transaction),
      account.initialBalance,
    ),
});

const assertTransfer = (
  input: CreateTransactionInput,
  userId: string,
): void => {
  if (input.type !== "transfer") return;
  if (!input.transferAccountId) {
    fail(400, "VALIDATION_ERROR", "Elegí una cuenta de destino", {
      transferAccountId: ["Seleccioná la cuenta de destino"],
    });
  }
  if (input.transferAccountId === input.accountId) {
    fail(400, "VALIDATION_ERROR", "Las cuentas deben ser distintas", {
      transferAccountId: ["Debe ser distinta de la cuenta origen"],
    });
  }
  findOwnedAccount(userId, input.accountId);
  findOwnedAccount(userId, input.transferAccountId);
};

const resolveAssistantRange = (period?: {
  from: string;
  to: string;
}): { from: string; to: string } => {
  const reference = new Date();
  const defaultTo = toIsoDate(reference);
  const defaultFrom = toIsoDate(
    new Date(
      reference.getFullYear(),
      reference.getMonth(),
      reference.getDate() - 29,
    ),
  );
  return { from: period?.from ?? defaultFrom, to: period?.to ?? defaultTo };
};

const flowBetween = (from: string, to: string) => {
  const inRange = mockState.transactions.filter(
    (transaction) => transaction.date >= from && transaction.date <= to,
  );
  const income = inRange
    .filter((transaction) => transaction.type === "income")
    .reduce((total, transaction) => total + transaction.amount, 0);
  const expenses = inRange
    .filter((transaction) => transaction.type === "expense")
    .reduce((total, transaction) => total + transaction.amount, 0);
  return { income, expenses, savings: income - expenses };
};

const buildAssistantAnswer = (
  question: string,
  from: string,
  to: string,
): { answer: string; insufficient: boolean; sources: string[] } => {
  const text = question.toLowerCase();

  if (text.includes("gast")) {
    const expenses = mockState.transactions.filter(
      (transaction) =>
        transaction.type === "expense" &&
        transaction.date >= from &&
        transaction.date <= to,
    );
    if (expenses.length === 0) {
      return {
        answer: "No registré gastos en el período indicado.",
        insufficient: true,
        sources: ["transactions"],
      };
    }
    const byCategory = new Map<string, number>();
    for (const transaction of expenses) {
      if (!transaction.categoryId) continue;
      byCategory.set(
        transaction.categoryId,
        (byCategory.get(transaction.categoryId) ?? 0) + transaction.amount,
      );
    }
    const [categoryId, value] = [...byCategory.entries()].sort(
      (a, b) => b[1] - a[1],
    )[0];
    const category = mockState.categories.find(
      (item) => item.id === categoryId,
    );
    const total = expenses.reduce(
      (sum, transaction) => sum + transaction.amount,
      0,
    );
    return {
      answer: `En el período indicado tu mayor gasto fue en ${category?.name ?? "sin categoría"}, con ${formatCurrency(value, CURRENCY)} (${formatPercent(value / total)} del total).`,
      insufficient: false,
      sources: ["transactions", "categories"],
    };
  }

  const flow = flowBetween(from, to);

  if (text.includes("ahorr")) {
    return {
      answer: `En el período indicado ahorraste ${formatCurrency(flow.savings, CURRENCY)} (ingresos menos gastos, sin contar transferencias).`,
      insufficient: false,
      sources: ["transactions"],
    };
  }

  if (flow.income === 0 && flow.expenses === 0) {
    return {
      answer:
        "No tengo movimientos suficientes en el período para responder con datos verificables.",
      insufficient: true,
      sources: ["transactions"],
    };
  }

  return {
    answer: `En el período indicado tus ingresos fueron ${formatCurrency(flow.income, CURRENCY)} y tus gastos ${formatCurrency(flow.expenses, CURRENCY)}, con un ahorro de ${formatCurrency(flow.savings, CURRENCY)}.`,
    insufficient: false,
    sources: ["transactions", "categories"],
  };
};

const monthRange = (from: string, to: string): string[] => {
  const months: string[] = [];
  const start = new Date(`${from.slice(0, 7)}-01T00:00:00`);
  const end = new Date(`${to.slice(0, 7)}-01T00:00:00`);
  const cursor = new Date(start);
  while (cursor <= end) {
    months.push(toIsoDate(cursor).slice(0, 7));
    cursor.setMonth(cursor.getMonth() + 1);
  }
  return months;
};

const monthEnd = (month: string): string => {
  const end = new Date(`${month}-01T00:00:00`);
  end.setMonth(end.getMonth() + 1);
  end.setDate(0);
  return toIsoDate(end);
};

const pctDelta = (current: number, previous: number): number | null => {
  if (previous === 0) return null;
  return ((current - previous) / Math.abs(previous)) * 100;
};

const previousRange = (from: string, to: string) => {
  const start = new Date(`${from}T00:00:00`);
  const end = new Date(`${to}T00:00:00`);
  const days = Math.max(
    1,
    Math.round((end.getTime() - start.getTime()) / 86_400_000) + 1,
  );
  const prevEnd = new Date(start);
  prevEnd.setDate(prevEnd.getDate() - 1);
  const prevStart = new Date(prevEnd);
  prevStart.setDate(prevStart.getDate() - (days - 1));
  return { from: toIsoDate(prevStart), to: toIsoDate(prevEnd) };
};

export const mockApi = {
  async login(input: LoginInput): Promise<{
    user: User;
    accessToken: string;
    refreshToken: string;
  }> {
    await delay();
    const record = findUserByEmail(input.email);
    if (!record || record.password !== input.password) {
      fail(401, "INVALID_CREDENTIALS", "Email o contraseña incorrectos");
    }
    sessionStore.setUserId(record.user.id);
    return {
      user: record.user,
      accessToken: `mock-access-${record.user.id}`,
      refreshToken: `mock-refresh-${record.user.id}`,
    };
  },

  async register(input: RegisterInput): Promise<AuthResponse> {
    await delay();
    if (findUserByEmail(input.email)) {
      fail(409, "EMAIL_IN_USE", "Ese email ya está registrado");
    }
    const user: User = {
      id: mockId(),
      name: input.name,
      email: input.email.toLowerCase(),
      createdAt: new Date().toISOString(),
    };
    mockState.users.push({ user, password: input.password });
    sessionStore.setUserId(user.id);
    return {
      user,
      accessToken: `mock-access-${user.id}`,
      refreshToken: `mock-refresh-${user.id}`,
    };
  },

  async logout(): Promise<void> {
    await delay();
    sessionStore.clear();
  },

  async me(): Promise<User> {
    await delay();
    return requireUser();
  },

  async updateUser(input: UpdateUserInput): Promise<User> {
    await delay();
    const current = requireUser();
    const record = findUserRecord(current.id);
    if (!record) fail(404, "NOT_FOUND", "El usuario no existe");
    record.user = { ...record.user, ...input };
    return record.user;
  },

  async listAccounts(): Promise<Account[]> {
    await delay();
    const user = requireUser();
    return mockState.accounts
      .filter((account) => account.userId === user.id)
      .map(deriveAccount);
  },

  async createAccount(input: CreateAccountInput): Promise<Account> {
    await delay();
    const user = requireUser();
    const account: StoredAccount = {
      id: mockId(),
      userId: user.id,
      name: input.name,
      type: input.type,
      initialBalance: input.initialBalance ?? 0,
      notes: input.notes ?? null,
      currentBalance: 0,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    mockState.accounts.push(account);
    return deriveAccount(account);
  },

  async updateAccount(id: string, input: UpdateAccountInput): Promise<Account> {
    await delay();
    const user = requireUser();
    const account = findOwnedAccount(user.id, id);
    Object.assign(account, input, { updatedAt: new Date().toISOString() });
    return deriveAccount(account);
  },

  async deleteAccount(id: string): Promise<void> {
    await delay();
    const user = requireUser();
    findOwnedAccount(user.id, id);
    mockState.accounts = mockState.accounts.filter(
      (account) => account.id !== id,
    );
    mockState.transactions = mockState.transactions.filter(
      (transaction) => transaction.accountId !== id,
    );
  },

  async listCategories(): Promise<Category[]> {
    await delay();
    requireUser();
    return mockState.categories;
  },

  async listTransactions(
    params: TransactionListQuery = {},
  ): Promise<Paginated<Transaction>> {
    await delay();
    const user = requireUser();
    const page = params.page && params.page > 0 ? params.page : 1;
    const pageSize = Math.min(
      params.pageSize && params.pageSize > 0
        ? params.pageSize
        : DEFAULT_PAGE_SIZE,
      MAX_PAGE_SIZE,
    );
    const filtered = mockState.transactions
      .filter((transaction) => transaction.userId === user.id)
      .sort((a, b) => {
        const byDate = b.date.localeCompare(a.date);
        if (byDate !== 0) return byDate;
        return b.createdAt.localeCompare(a.createdAt);
      });
    const total = filtered.length;
    const totalPages = Math.max(1, Math.ceil(total / pageSize));
    const start = (page - 1) * pageSize;
    return {
      items: filtered.slice(start, start + pageSize),
      page,
      pageSize,
      total,
      totalPages,
    };
  },

  async createTransaction(input: CreateTransactionInput): Promise<Transaction> {
    await delay();
    const user = requireUser();
    findOwnedAccount(user.id, input.accountId);

    if (input.type === "transfer") {
      assertTransfer(input, user.id);
      const groupId = mockId();
      const createdAt = new Date().toISOString();
      const outbound: StoredTransaction = {
        id: mockId(),
        userId: user.id,
        type: "transfer",
        amount: -Math.abs(input.amount),
        date: input.date,
        description: input.description,
        notes: input.notes ?? null,
        accountId: input.accountId,
        transferAccountId: input.transferAccountId ?? null,
        categoryId: null,
        transferGroupId: groupId,
        createdAt,
        updatedAt: createdAt,
      };
      const inbound: StoredTransaction = {
        ...outbound,
        id: mockId(),
        amount: Math.abs(input.amount),
        accountId: input.transferAccountId ?? input.accountId,
        transferAccountId: input.accountId,
      };
      mockState.transactions.push(outbound, inbound);
      return outbound;
    }

    if (input.categoryId && !findOwnedCategory(input.categoryId)) {
      fail(404, "NOT_FOUND", "La categoría no existe");
    }
    const transaction: StoredTransaction = {
      id: mockId(),
      userId: user.id,
      type: input.type,
      amount: Math.abs(input.amount),
      date: input.date,
      description: input.description,
      notes: input.notes ?? null,
      accountId: input.accountId,
      transferAccountId: null,
      transferGroupId: null,
      categoryId: input.categoryId ?? null,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    mockState.transactions.push(transaction);
    return transaction;
  },

  async updateTransaction(
    id: string,
    input: UpdateTransactionInput,
  ): Promise<Transaction> {
    await delay();
    const user = requireUser();
    const transaction = mockState.transactions.find(
      (item) => item.id === id && item.userId === user.id,
    );
    if (!transaction) fail(404, "NOT_FOUND", "El movimiento no existe");

    if (transaction.type === "transfer" && transaction.transferGroupId) {
      const group = mockState.transactions.filter(
        (item) => item.transferGroupId === transaction.transferGroupId,
      );
      for (const item of group) {
        Object.assign(item, {
          amount:
            item.amount < 0
              ? -Math.abs(input.amount ?? Math.abs(item.amount))
              : Math.abs(input.amount ?? Math.abs(item.amount)),
          date: input.date ?? item.date,
          description: input.description ?? item.description,
          notes: input.notes ?? item.notes,
          updatedAt: new Date().toISOString(),
        });
      }
      return transaction;
    }

    if (input.accountId) findOwnedAccount(user.id, input.accountId);
    Object.assign(transaction, input, {
      amount:
        input.amount === undefined
          ? transaction.amount
          : Math.abs(input.amount),
      updatedAt: new Date().toISOString(),
    });
    return transaction;
  },

  async deleteTransaction(id: string): Promise<void> {
    await delay();
    const user = requireUser();
    const transaction = mockState.transactions.find(
      (item) => item.id === id && item.userId === user.id,
    );
    if (!transaction) fail(404, "NOT_FOUND", "El movimiento no existe");
    const groupId = transaction.transferGroupId;
    mockState.transactions = mockState.transactions.filter((item) =>
      groupId ? item.transferGroupId !== groupId : item.id !== transaction.id,
    );
  },

  async sendMessage(input: AssistantMessageInput): Promise<AssistantReply> {
    await delay();
    requireUser();
    const { from, to } = resolveAssistantRange(input.period);
    const { answer, insufficient, sources } = buildAssistantAnswer(
      input.question,
      from,
      to,
    );
    return {
      answer,
      insufficient,
      currency: CURRENCY,
      sources,
      disclaimer: DISCLAIMER,
    };
  },

  async dashboard(params: {
    from: string;
    to: string;
  }): Promise<DashboardData> {
    await delay();
    const user = requireUser();
    const current = flowBetween(params.from, params.to);
    const previous = previousRange(params.from, params.to);
    const prevFlow = flowBetween(previous.from, previous.to);

    const ownedTransactions = mockState.transactions.filter(
      (transaction) => transaction.userId === user.id,
    );
    const activeAccounts = mockState.accounts.filter(
      (account) => account.userId === user.id,
    );
    const initialTotal = activeAccounts.reduce(
      (total, account) => total + account.initialBalance,
      0,
    );

    const netWorthAt = (endIso: string): number =>
      ownedTransactions
        .filter((transaction) => transaction.date <= endIso)
        .reduce(
          (total, transaction) => total + signedAmount(transaction),
          initialTotal,
        );

    const netWorth = activeAccounts.reduce(
      (total, account) => total + deriveAccount(account).currentBalance,
      0,
    );

    const months = monthRange(params.from, params.to);
    const incomeExpenseByMonth = months.map((month) => {
      const monthTx = ownedTransactions.filter(
        (transaction) => transaction.date.slice(0, 7) === month,
      );
      const income = monthTx
        .filter((transaction) => transaction.type === "income")
        .reduce((total, transaction) => total + transaction.amount, 0);
      const expenses = monthTx
        .filter((transaction) => transaction.type === "expense")
        .reduce((total, transaction) => total + transaction.amount, 0);
      return { month, income, expenses };
    });

    const netWorthSeries = months.map((month) => ({
      date: monthEnd(month),
      value: netWorthAt(monthEnd(month)),
    }));
    const seriesStart = netWorthSeries[0]?.value ?? netWorth;

    const expenseTransactions = ownedTransactions.filter(
      (transaction) =>
        transaction.type === "expense" &&
        transaction.date >= params.from &&
        transaction.date <= params.to,
    );
    const byCategory = new Map<string, number>();
    for (const transaction of expenseTransactions) {
      if (!transaction.categoryId) continue;
      byCategory.set(
        transaction.categoryId,
        (byCategory.get(transaction.categoryId) ?? 0) + transaction.amount,
      );
    }
    const expensesByCategory = [...byCategory.entries()]
      .map(([categoryId, value]) => {
        const category = mockState.categories.find(
          (item) => item.id === categoryId,
        );
        return {
          categoryId,
          name: category?.name ?? "Sin categoría",
          color: category?.color ?? "#64748b",
          value,
        };
      })
      .sort((a, b) => b.value - a.value);

    return {
      period: { from: params.from, to: params.to },
      currency: CURRENCY,
      kpis: {
        netWorth,
        netWorthDeltaPct: pctDelta(netWorth, seriesStart),
        income: current.income,
        incomeDeltaPct: pctDelta(current.income, prevFlow.income),
        expenses: current.expenses,
        expensesDeltaPct: pctDelta(current.expenses, prevFlow.expenses),
        savings: current.savings,
        savingsDeltaPct: pctDelta(current.savings, prevFlow.savings),
        savingsRateDeltaPp:
          ((current.income > 0 ? current.savings / current.income : 0) -
            (prevFlow.income > 0 ? prevFlow.savings / prevFlow.income : 0)) *
          100,
      },
      netWorthSeries,
      incomeExpenseByMonth,
      expensesByCategory,
    };
  },
};

export type MockApi = typeof mockApi;
