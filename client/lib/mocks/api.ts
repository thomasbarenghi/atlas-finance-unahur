import { ApiError } from "@/lib/api/client";
import { sessionStore } from "@/lib/api/session";
import { formatCurrency, formatPercent, toIsoDate } from "@/lib/format";
import type {
  Account,
  Asset,
  AssistantAudioInput,
  AssistantMessageInput,
  AssistantReply,
  Budget,
  BudgetStatus,
  Category,
  Conversation,
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
} from "@/lib/api/types";
import {
  BUDGET_WARNING_THRESHOLD,
  convertCurrency,
  DEMO_EMAIL,
  findUserByEmail,
  findUserRecord,
  mockId,
  mockState,
  QUOTE_STALE_MS,
  signedAmount,
  type StoredAccount,
  type StoredAsset,
  type StoredBudget,
  type StoredCategory,
  type StoredConversation,
  type StoredDebt,
  type StoredPosition,
  type StoredTransaction,
} from "./store";

const SUPPORTED_CURRENCIES = ["ARS", "USD", "EUR", "BRL", "UYU"];
const DEFAULT_PAGE_SIZE = 20;
const MAX_PAGE_SIZE = 100;

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

const assertAccountUsable = (account: Account): void => {
  if (account.archived) {
    fail(409, "ACCOUNT_ARCHIVED", "La cuenta está archivada");
  }
};

const findOwnedCategory = (
  userId: string,
  categoryId: string,
): Category | undefined =>
  mockState.categories.find(
    (category) =>
      category.id === categoryId &&
      (category.isSystem || category.userId === userId),
  );

const isQuoteStale = (quote: Quote): boolean =>
  Date.now() - new Date(quote.fetchedAt).getTime() > QUOTE_STALE_MS;

const deriveAccount = (account: Account): Account => {
  if (account.type === "goal") {
    return { ...account, currentBalance: account.initialBalance };
  }
  return {
    ...account,
    currentBalance: mockState.transactions
      .filter((transaction) => transaction.accountId === account.id)
      .reduce(
        (total, transaction) => total + signedAmount(transaction),
        account.initialBalance,
      ),
  };
};

const deriveBudget = (budget: Budget): Budget => {
  const month = budget.period.slice(0, 7);
  const spent = mockState.transactions
    .filter(
      (transaction) =>
        transaction.type === "expense" &&
        transaction.categoryId === budget.categoryId &&
        transaction.date.slice(0, 7) === month,
    )
    .reduce((total, transaction) => total + transaction.amount, 0);
  const available = budget.limit - spent;
  const consumedPct = budget.limit > 0 ? (spent / budget.limit) * 100 : 0;
  const status: BudgetStatus =
    budget.limit > 0 && spent > budget.limit
      ? "exceeded"
      : budget.limit > 0 && spent >= budget.limit * BUDGET_WARNING_THRESHOLD
        ? "warning"
        : "available";
  return { ...budget, spent, available, consumedPct, status };
};

const projectBudgetsForMonth = (
  budgets: StoredBudget[],
  month: string,
): StoredBudget[] => {
  const explicit = budgets.filter(
    (budget) => budget.period.slice(0, 7) === month,
  );
  const explicitCategoryIds = new Set(
    explicit.map((budget) => budget.categoryId),
  );
  const latestRecurringByCategory = new Map<string, StoredBudget>();

  for (const budget of budgets) {
    if (!budget.recurring) continue;
    if (budget.period.slice(0, 7) > month) continue;
    if (explicitCategoryIds.has(budget.categoryId)) continue;
    const current = latestRecurringByCategory.get(budget.categoryId);
    if (!current || budget.period.slice(0, 7) > current.period.slice(0, 7)) {
      latestRecurringByCategory.set(budget.categoryId, budget);
    }
  }

  const projected = [...latestRecurringByCategory.values()].map((template) => ({
    ...template,
    period: `${month}-01`,
  }));

  return [...explicit, ...projected];
};

const deriveAsset = (asset: Asset): Asset => {
  const latest = mockState.valuations
    .filter((valuation) => valuation.assetId === asset.id)
    .sort((a, b) => b.date.localeCompare(a.date))[0];
  const debt = mockState.debts.find((item) => item.assetId === asset.id);
  return {
    ...asset,
    currentValue: latest?.value ?? 0,
    valuationDate: latest?.date ?? asset.valuationDate,
    debtId: debt?.id ?? null,
  };
};

const derivePosition = (position: Position): Position => {
  const costBasis = position.quantity * position.avgCost;
  const quote = mockState.quotes.find(
    (item) =>
      item.symbol === position.symbol && item.currency === position.currency,
  );
  if (!quote) {
    return {
      ...position,
      costBasis,
      currentPrice: null,
      currentValue: null,
      profitLoss: null,
      profitLossPct: null,
      quoteDate: null,
      quoteProvider: null,
      isStale: false,
    };
  }
  const currentValue = position.quantity * quote.price;
  const profitLoss = currentValue - costBasis;
  return {
    ...position,
    costBasis,
    currentPrice: quote.price,
    currentValue,
    profitLoss,
    profitLossPct: costBasis > 0 ? (profitLoss / costBasis) * 100 : 0,
    quoteDate: quote.fetchedAt,
    quoteProvider: quote.provider,
    isStale: isQuoteStale(quote),
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

const netWorthIn = (currency: string): number => {
  const assets = mockState.assets.reduce(
    (total, asset) =>
      total +
      convertCurrency(
        deriveAsset(asset).currentValue,
        asset.currency,
        currency,
      ),
    0,
  );
  const positions = mockState.positions.reduce((total, position) => {
    const derived = derivePosition(position);
    return (
      total +
      convertCurrency(derived.currentValue ?? 0, position.currency, currency)
    );
  }, 0);
  const accounts = mockState.accounts
    .filter((account) => account.type !== "goal" && !account.archived)
    .reduce(
      (total, account) =>
        total +
        convertCurrency(
          deriveAccount(account).currentBalance,
          account.currency,
          currency,
        ),
      0,
    );
  const debts = mockState.debts
    .filter((debt) => !debt.archived)
    .reduce(
      (total, debt) =>
        total + convertCurrency(debt.balance, debt.currency, currency),
      0,
    );
  return assets + positions + accounts - debts;
};

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
  const destination = findOwnedAccount(userId, input.transferAccountId);
  assertAccountUsable(destination);
  const origin = findOwnedAccount(userId, input.accountId);
  assertAccountUsable(origin);
};

const buildAssistantAnswer = (
  question: string,
  currency: string,
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
        (byCategory.get(transaction.categoryId) ?? 0) +
          convertCurrency(transaction.amount, transaction.currency, currency),
      );
    }
    const [categoryId, value] = [...byCategory.entries()].sort(
      (a, b) => b[1] - a[1],
    )[0];
    const category = mockState.categories.find(
      (item) => item.id === categoryId,
    );
    const total = expenses.reduce(
      (sum, transaction) =>
        sum +
        convertCurrency(transaction.amount, transaction.currency, currency),
      0,
    );
    return {
      answer: `En el período indicado tu mayor gasto fue en ${category?.name ?? "sin categoría"}, con ${formatCurrency(value, currency)} (${formatPercent(value / total)} del total).`,
      insufficient: false,
      sources: ["transactions", "categories"],
    };
  }

  if (text.includes("presupuesto")) {
    const month = to.slice(0, 7);
    const alerts = projectBudgetsForMonth(mockState.budgets, month)
      .map(deriveBudget)
      .filter((budget) => budget.status !== "available");
    if (alerts.length === 0) {
      return {
        answer: "Tus presupuestos del período están dentro del límite.",
        insufficient: false,
        sources: ["budgets", "transactions"],
      };
    }
    const detail = alerts
      .map(
        (budget) =>
          `${budget.category.name} (${budget.consumedPct.toFixed(1)}%, ${budget.status === "exceeded" ? "excedido" : "en advertencia"})`,
      )
      .join(", ");
    return {
      answer: `Estos presupuestos requieren atención: ${detail}.`,
      insufficient: false,
      sources: ["budgets", "transactions"],
    };
  }

  if (text.includes("patrimonio")) {
    return {
      answer: `Tu patrimonio neto actual es ${formatCurrency(netWorthIn(currency), currency)}, sumando activos, inversiones y cuentas menos deudas.`,
      insufficient: false,
      sources: ["assets", "valuations", "debts"],
    };
  }

  const flow = flowBetween(from, to);
  if (text.includes("ahorr")) {
    return {
      answer: `En el período indicado ahorraste ${formatCurrency(flow.savings, currency)} (ingresos menos gastos, sin contar transferencias).`,
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
    answer: `En el período indicado tus ingresos fueron ${formatCurrency(flow.income, currency)} y tus gastos ${formatCurrency(flow.expenses, currency)}, con un ahorro de ${formatCurrency(flow.savings, currency)}.`,
    insufficient: false,
    sources: ["transactions", "categories"],
  };
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

let parsedResetToken: string | null = null;

export const mockApi = {
  async login(
    input: LoginInput,
  ): Promise<{ user: User; accessToken: string; refreshToken: string }> {
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

  async register(
    input: RegisterInput,
  ): Promise<{ user: User; accessToken: string; refreshToken: string }> {
    await delay();
    if (findUserByEmail(input.email)) {
      fail(409, "EMAIL_IN_USE", "Ese email ya está registrado");
    }
    const createdAt = new Date().toISOString();
    const user: User = {
      id: mockId(),
      name: input.name,
      email: input.email.toLowerCase(),
      baseCurrency: "ARS",
      theme: "system",
      aiEnabled: false,
      createdAt,
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

  async listCurrencies(): Promise<CurrenciesResponse> {
    await delay();
    return { default: "ARS", supported: SUPPORTED_CURRENCIES };
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
      ...input,
      notes: input.notes ?? null,
      targetAmount: input.targetAmount ?? null,
      targetDate: input.targetDate ?? null,
      sourceAccountId: input.sourceAccountId ?? null,
      currentBalance: 0,
      archived: false,
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

  async archiveAccount(id: string): Promise<Account> {
    await delay();
    const user = requireUser();
    const account = findOwnedAccount(user.id, id);
    account.archived = true;
    return deriveAccount(account);
  },

  async restoreAccount(id: string): Promise<Account> {
    await delay();
    const user = requireUser();
    const account = findOwnedAccount(user.id, id);
    account.archived = false;
    return deriveAccount(account);
  },

  async listCategories(): Promise<Category[]> {
    await delay();
    const user = requireUser();
    return mockState.categories.filter(
      (category) => category.isSystem || category.userId === user.id,
    );
  },

  async createCategory(input: CreateCategoryInput): Promise<Category> {
    await delay();
    const user = requireUser();
    const category: StoredCategory = {
      id: mockId(),
      userId: user.id,
      ...input,
      icon: input.icon ?? null,
      archived: false,
      isSystem: false,
    };
    mockState.categories.push(category);
    return category;
  },

  async updateCategory(
    id: string,
    input: UpdateCategoryInput,
  ): Promise<Category> {
    await delay();
    const user = requireUser();
    const category = findOwnedCategory(user.id, id);
    if (!category) fail(404, "NOT_FOUND", "La categoría no existe");
    if (category.isSystem) {
      fail(403, "FORBIDDEN", "Las categorías del sistema no se editan");
    }
    Object.assign(category, input);
    return category;
  },

  async archiveCategory(id: string): Promise<Category> {
    await delay();
    const user = requireUser();
    const category = findOwnedCategory(user.id, id);
    if (!category) fail(404, "NOT_FOUND", "La categoría no existe");
    if (category.isSystem) {
      fail(403, "FORBIDDEN", "Las categorías del sistema no se archivan");
    }
    category.archived = true;
    return category;
  },

  async listTransactions(
    filters: TransactionFilters = {},
  ): Promise<Paginated<Transaction>> {
    await delay();
    const user = requireUser();
    const page = filters.page && filters.page > 0 ? filters.page : 1;
    const pageSize = Math.min(
      filters.pageSize && filters.pageSize > 0
        ? filters.pageSize
        : DEFAULT_PAGE_SIZE,
      MAX_PAGE_SIZE,
    );
    const search = filters.search?.trim().toLowerCase();
    const filtered = mockState.transactions
      .filter((transaction) => transaction.userId === user.id)
      .filter(
        (transaction) => !filters.from || transaction.date >= filters.from,
      )
      .filter((transaction) => !filters.to || transaction.date <= filters.to)
      .filter(
        (transaction) => !filters.type || transaction.type === filters.type,
      )
      .filter(
        (transaction) =>
          !filters.accountId || transaction.accountId === filters.accountId,
      )
      .filter(
        (transaction) =>
          !filters.categoryId || transaction.categoryId === filters.categoryId,
      )
      .filter((transaction) => {
        if (!search) return true;
        return `${transaction.description} ${transaction.notes ?? ""}`
          .toLowerCase()
          .includes(search);
      })
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
    const account = findOwnedAccount(user.id, input.accountId);
    assertAccountUsable(account);

    if (input.type === "transfer") {
      assertTransfer(input, user.id);
      const groupId = mockId();
      const createdAt = new Date().toISOString();
      const outbound: StoredTransaction = {
        id: mockId(),
        userId: user.id,
        type: "transfer",
        amount: -Math.abs(input.amount),
        currency: input.currency,
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

    if (input.categoryId && !findOwnedCategory(user.id, input.categoryId)) {
      fail(404, "NOT_FOUND", "La categoría no existe");
    }
    const transaction: StoredTransaction = {
      id: mockId(),
      userId: user.id,
      ...input,
      amount: Math.abs(input.amount),
      notes: input.notes ?? null,
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

    if (input.accountId) {
      assertAccountUsable(findOwnedAccount(user.id, input.accountId));
    }
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

  async listBudgets(period?: string): Promise<Budget[]> {
    await delay();
    const user = requireUser();
    const month = period?.slice(0, 7);
    const scoped = mockState.budgets.filter(
      (budget) => budget.userId === user.id,
    );
    const budgets = month ? projectBudgetsForMonth(scoped, month) : scoped;
    return budgets.map(deriveBudget);
  },

  async createBudget(input: CreateBudgetInput): Promise<Budget> {
    await delay();
    const user = requireUser();
    const category = findOwnedCategory(user.id, input.categoryId);
    if (!category) fail(404, "NOT_FOUND", "La categoría no existe");
    const exists = mockState.budgets.some(
      (budget) =>
        budget.userId === user.id &&
        budget.categoryId === input.categoryId &&
        budget.period.slice(0, 7) === input.period.slice(0, 7),
    );
    if (exists) {
      fail(
        409,
        "DUPLICATE_BUDGET",
        "Ya existe un presupuesto para ese período",
      );
    }
    const budget: StoredBudget = {
      id: mockId(),
      userId: user.id,
      categoryId: category.id,
      category: { id: category.id, name: category.name, color: category.color },
      period: `${input.period.slice(0, 7)}-01`,
      limit: input.limit,
      currency: input.currency,
      recurring: input.recurring ?? false,
      spent: 0,
      available: input.limit,
      consumedPct: 0,
      status: "available",
    };
    mockState.budgets.push(budget);
    return deriveBudget(budget);
  },

  async updateBudget(id: string, input: UpdateBudgetInput): Promise<Budget> {
    await delay();
    const user = requireUser();
    const budget = mockState.budgets.find(
      (item) => item.id === id && item.userId === user.id,
    );
    if (!budget) fail(404, "NOT_FOUND", "El presupuesto no existe");
    Object.assign(budget, input);
    return deriveBudget(budget);
  },

  async deleteBudget(id: string): Promise<void> {
    await delay();
    const user = requireUser();
    const budget = mockState.budgets.find(
      (item) => item.id === id && item.userId === user.id,
    );
    if (!budget) fail(404, "NOT_FOUND", "El presupuesto no existe");
    mockState.budgets = mockState.budgets.filter((item) => item.id !== id);
  },

  async copyPreviousBudgets(input: {
    period: string;
    sourcePeriod?: string;
  }): Promise<Budget[]> {
    await delay();
    const user = requireUser();
    const target = input.period.slice(0, 7);
    const sourceDate = new Date(`${target}-01T00:00:00`);
    sourceDate.setMonth(sourceDate.getMonth() - 1);
    const source =
      input.sourcePeriod?.slice(0, 7) ?? toIsoDate(sourceDate).slice(0, 7);
    const originals = mockState.budgets.filter(
      (budget) =>
        budget.userId === user.id && budget.period.slice(0, 7) === source,
    );
    const copies: Budget[] = [];
    for (const original of originals) {
      const exists = mockState.budgets.some(
        (budget) =>
          budget.userId === user.id &&
          budget.categoryId === original.categoryId &&
          budget.period.slice(0, 7) === target,
      );
      if (exists) continue;
      const copy: StoredBudget = {
        ...original,
        id: mockId(),
        period: `${target}-01`,
        recurring: false,
      };
      mockState.budgets.push(copy);
      copies.push(deriveBudget(copy));
    }
    return copies;
  },

  async listAssets(): Promise<Asset[]> {
    await delay();
    const user = requireUser();
    return mockState.assets
      .filter((asset) => asset.userId === user.id)
      .map(deriveAsset);
  },

  async createAsset(input: CreateAssetInput): Promise<Asset> {
    await delay();
    const user = requireUser();
    const asset: StoredAsset = {
      id: mockId(),
      userId: user.id,
      name: input.name,
      type: input.type,
      currency: input.currency,
      notes: input.notes ?? null,
      currentValue: 0,
      valuationDate: input.date,
      archived: false,
      debtId: null,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    mockState.assets.push(asset);
    mockState.valuations.push({
      id: mockId(),
      assetId: asset.id,
      value: input.initialValue,
      currency: input.currency,
      date: input.date,
      source: "manual",
      createdAt: new Date().toISOString(),
    });
    return deriveAsset(asset);
  },

  async updateAsset(id: string, input: UpdateAssetInput): Promise<Asset> {
    await delay();
    const user = requireUser();
    const asset = mockState.assets.find(
      (item) => item.id === id && item.userId === user.id,
    );
    if (!asset) fail(404, "NOT_FOUND", "El activo no existe");
    Object.assign(asset, input, { updatedAt: new Date().toISOString() });
    return deriveAsset(asset);
  },

  async archiveAsset(id: string): Promise<Asset> {
    await delay();
    const user = requireUser();
    const asset = mockState.assets.find(
      (item) => item.id === id && item.userId === user.id,
    );
    if (!asset) fail(404, "NOT_FOUND", "El activo no existe");
    asset.archived = true;
    return deriveAsset(asset);
  },

  async listValuations(assetId: string): Promise<Valuation[]> {
    await delay();
    const user = requireUser();
    if (
      !mockState.assets.some(
        (asset) => asset.id === assetId && asset.userId === user.id,
      )
    ) {
      fail(404, "NOT_FOUND", "El activo no existe");
    }
    return mockState.valuations
      .filter((valuation) => valuation.assetId === assetId)
      .sort((a, b) => b.date.localeCompare(a.date));
  },

  async createValuation(
    assetId: string,
    input: CreateValuationInput,
  ): Promise<Valuation> {
    await delay();
    const user = requireUser();
    const asset = mockState.assets.find(
      (item) => item.id === assetId && item.userId === user.id,
    );
    if (!asset) fail(404, "NOT_FOUND", "El activo no existe");
    const valuation: Valuation = {
      id: mockId(),
      assetId,
      value: input.value,
      currency: input.currency,
      date: input.date,
      source: input.source ?? "manual",
      createdAt: new Date().toISOString(),
    };
    mockState.valuations.push(valuation);
    return valuation;
  },

  async listDebts(): Promise<Debt[]> {
    await delay();
    const user = requireUser();
    return mockState.debts.filter((debt) => debt.userId === user.id);
  },

  async createDebt(input: CreateDebtInput): Promise<Debt> {
    await delay();
    const user = requireUser();
    const debt: StoredDebt = {
      id: mockId(),
      userId: user.id,
      ...input,
      assetId: input.assetId ?? null,
      archived: false,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    mockState.debts.push(debt);
    return debt;
  },

  async updateDebt(id: string, input: UpdateDebtInput): Promise<Debt> {
    await delay();
    const user = requireUser();
    const debt = mockState.debts.find(
      (item) => item.id === id && item.userId === user.id,
    );
    if (!debt) fail(404, "NOT_FOUND", "La deuda no existe");
    Object.assign(debt, input, { updatedAt: new Date().toISOString() });
    return debt;
  },

  async archiveDebt(id: string): Promise<Debt> {
    await delay();
    const user = requireUser();
    const debt = mockState.debts.find(
      (item) => item.id === id && item.userId === user.id,
    );
    if (!debt) fail(404, "NOT_FOUND", "La deuda no existe");
    debt.archived = true;
    return debt;
  },

  async listPositions(): Promise<Position[]> {
    await delay();
    const user = requireUser();
    return mockState.positions
      .filter((position) => position.userId === user.id)
      .map(derivePosition);
  },

  async createPosition(input: CreatePositionInput): Promise<Position> {
    await delay();
    const user = requireUser();
    const position: StoredPosition = {
      id: mockId(),
      userId: user.id,
      ...input,
      currentPrice: null,
      currentValue: null,
      costBasis: 0,
      profitLoss: null,
      profitLossPct: null,
      quoteDate: null,
      quoteProvider: null,
      isStale: false,
    };
    mockState.positions.push(position);
    return derivePosition(position);
  },

  async updatePosition(
    id: string,
    input: UpdatePositionInput,
  ): Promise<Position> {
    await delay();
    const user = requireUser();
    const position = mockState.positions.find(
      (item) => item.id === id && item.userId === user.id,
    );
    if (!position) fail(404, "NOT_FOUND", "La posición no existe");
    Object.assign(position, input);
    return derivePosition(position);
  },

  async deletePosition(id: string): Promise<void> {
    await delay();
    const user = requireUser();
    const position = mockState.positions.find(
      (item) => item.id === id && item.userId === user.id,
    );
    if (!position) fail(404, "NOT_FOUND", "La posición no existe");
    mockState.positions = mockState.positions.filter((item) => item.id !== id);
  },

  async listQuotes(): Promise<Quote[]> {
    await delay();
    return mockState.quotes.map((quote) => ({
      ...quote,
      isStale: isQuoteStale(quote),
    }));
  },

  async sendMessage(input: AssistantMessageInput): Promise<AssistantReply> {
    await delay();
    const user = requireUser();
    if (!user.aiEnabled) {
      fail(403, "AI_DISABLED", "El asistente está deshabilitado");
    }
    const currency = input.currency ?? user.baseCurrency;
    const { from, to } = resolveAssistantRange(input.period);

    const { answer, insufficient, sources } = buildAssistantAnswer(
      input.question,
      currency,
      from,
      to,
    );

    const conversation: StoredConversation = {
      id: input.conversationId ?? mockId(),
      userId: user.id,
      question: input.question,
      answer,
      contextMeta: { period: { from, to }, currency, sources },
      createdAt: new Date().toISOString(),
    };
    mockState.conversations.push(conversation);

    return {
      conversationId: conversation.id,
      answer,
      insufficient,
      contextMeta: conversation.contextMeta,
    };
  },

  async sendAudioMessage(input: AssistantAudioInput): Promise<AssistantReply> {
    await delay();
    const user = requireUser();
    if (!user.aiEnabled) {
      fail(403, "AI_DISABLED", "El asistente está deshabilitado");
    }
    const currency = input.currency ?? user.baseCurrency;
    const { from, to } = resolveAssistantRange(input.period);
    const question = input.transcript?.trim();

    if (!question) {
      return {
        conversationId: input.conversationId ?? mockId(),
        answer:
          "Recibí tu audio, pero no pude transcribirlo en este navegador. Escribí tu pregunta o probá con dictado por voz disponible.",
        insufficient: true,
        contextMeta: { period: { from, to }, currency, sources: [] },
      };
    }

    const { answer, insufficient, sources } = buildAssistantAnswer(
      question,
      currency,
      from,
      to,
    );
    const conversation: StoredConversation = {
      id: input.conversationId ?? mockId(),
      userId: user.id,
      question: `[Audio] ${question}`,
      answer,
      contextMeta: { period: { from, to }, currency, sources },
      createdAt: new Date().toISOString(),
    };
    mockState.conversations.push(conversation);

    return {
      conversationId: conversation.id,
      answer,
      insufficient,
      contextMeta: conversation.contextMeta,
    };
  },

  async listConversations(): Promise<Conversation[]> {
    await delay();
    const user = requireUser();
    return mockState.conversations.filter(
      (conversation) => conversation.userId === user.id,
    );
  },

  async deleteConversations(): Promise<void> {
    await delay();
    const user = requireUser();
    mockState.conversations = mockState.conversations.filter(
      (conversation) => conversation.userId !== user.id,
    );
  },

  async forgotPassword(email: string): Promise<void> {
    await delay();
    parsedResetToken = `reset-${email}`;
  },

  async resetPassword(input: ResetPasswordInput): Promise<void> {
    await delay();
    const record = findUserByEmail(DEMO_EMAIL);
    if (!parsedResetToken) fail(400, "VALIDATION_ERROR", "Token inválido");
    if (record) record.password = input.password;
    parsedResetToken = null;
  },

  async dashboard(query: {
    from: string;
    to: string;
    currency?: string;
  }): Promise<DashboardData> {
    await delay();
    const user = requireUser();
    const currency = query.currency ?? user.baseCurrency;
    const current = flowBetween(query.from, query.to);
    const previous = previousRange(query.from, query.to);
    const prevFlow = flowBetween(previous.from, previous.to);
    const netWorth = netWorthIn(currency);

    const months = monthRange(query.from, query.to);
    const incomeExpenseByMonth = months.map((month) => {
      const monthTx = mockState.transactions.filter(
        (transaction) =>
          transaction.userId === user.id &&
          transaction.date.slice(0, 7) === month,
      );
      const income = monthTx
        .filter((transaction) => transaction.type === "income")
        .reduce(
          (total, transaction) =>
            total +
            convertCurrency(transaction.amount, transaction.currency, currency),
          0,
        );
      const expenses = monthTx
        .filter((transaction) => transaction.type === "expense")
        .reduce(
          (total, transaction) =>
            total +
            convertCurrency(transaction.amount, transaction.currency, currency),
          0,
        );
      return { month, income, expenses };
    });

    const expenseTransactions = mockState.transactions.filter(
      (transaction) =>
        transaction.userId === user.id &&
        transaction.type === "expense" &&
        transaction.date >= query.from &&
        transaction.date <= query.to,
    );
    const byCategory = new Map<string, number>();
    for (const transaction of expenseTransactions) {
      if (!transaction.categoryId) continue;
      byCategory.set(
        transaction.categoryId,
        (byCategory.get(transaction.categoryId) ?? 0) +
          convertCurrency(transaction.amount, transaction.currency, currency),
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

    const incomeTransactions = mockState.transactions.filter(
      (transaction) =>
        transaction.userId === user.id &&
        transaction.type === "income" &&
        transaction.date >= query.from &&
        transaction.date <= query.to,
    );
    const byIncomeCategory = new Map<string, number>();
    for (const transaction of incomeTransactions) {
      const key = transaction.categoryId ?? "other";
      byIncomeCategory.set(
        key,
        (byIncomeCategory.get(key) ?? 0) +
          convertCurrency(transaction.amount, transaction.currency, currency),
      );
    }
    const incomeSources = [...byIncomeCategory.entries()]
      .map(([categoryId, value]) => {
        const category = mockState.categories.find(
          (item) => item.id === categoryId,
        );
        return { name: category?.name ?? "Otros ingresos", value };
      })
      .sort((a, b) => b.value - a.value);

    const derivedPositions = mockState.positions
      .filter((position) => position.userId === user.id)
      .map(derivePosition);
    const positionsValue = derivedPositions.reduce(
      (sum, position) =>
        sum +
        convertCurrency(
          position.currentValue ?? 0,
          position.currency,
          currency,
        ),
      0,
    );
    const positionsCost = derivedPositions.reduce(
      (sum, position) =>
        sum + convertCurrency(position.costBasis, position.currency, currency),
      0,
    );
    const positionsProfit = positionsValue - positionsCost;

    const activeAccounts = mockState.accounts.filter(
      (account) =>
        account.userId === user.id &&
        account.type !== "goal" &&
        !account.archived,
    );
    const convertAccount = (account: Account): number =>
      convertCurrency(
        deriveAccount(account).currentBalance,
        account.currency,
        currency,
      );
    const accountsValue = activeAccounts.reduce(
      (total, account) => total + convertAccount(account),
      0,
    );

    const compositionMap = new Map<Asset["type"], number>();
    for (const asset of mockState.assets.filter(
      (item) => item.userId === user.id && !item.archived,
    )) {
      const derived = deriveAsset(asset);
      compositionMap.set(
        asset.type,
        (compositionMap.get(asset.type) ?? 0) +
          convertCurrency(derived.currentValue, asset.currency, currency),
      );
    }
    const assetsComposition = [...compositionMap.entries()].map(
      ([type, value]) => ({ type, value }),
    );
    const assetsValue = assetsComposition.reduce(
      (total, item) => total + item.value,
      0,
    );
    const debtsValue = mockState.debts
      .filter((debt) => debt.userId === user.id && !debt.archived)
      .reduce(
        (total, debt) =>
          total + convertCurrency(debt.balance, debt.currency, currency),
        0,
      );

    const assetsValueByMonth = months.map((month) => {
      const end = new Date(`${month}-01T00:00:00`);
      end.setMonth(end.getMonth() + 1);
      end.setDate(0);
      const endIso = toIsoDate(end);
      let value = 0;
      for (const asset of mockState.assets.filter(
        (item) => item.userId === user.id && !item.archived,
      )) {
        const assetValuations = mockState.valuations
          .filter((valuation) => valuation.assetId === asset.id)
          .sort((a, b) => a.date.localeCompare(b.date));
        if (assetValuations.length === 0) continue;
        const upTo = assetValuations.filter(
          (valuation) => valuation.date <= endIso,
        );
        const chosen =
          upTo.length > 0 ? upTo[upTo.length - 1] : assetValuations[0];
        value += convertCurrency(chosen.value, chosen.currency, currency);
      }
      return { month, value };
    });

    const budgetAlerts = projectBudgetsForMonth(
      mockState.budgets.filter((budget) => budget.userId === user.id),
      query.to.slice(0, 7),
    )
      .map(deriveBudget)
      .filter((budget) => budget.status !== "available")
      .map((budget) => ({
        budgetId: budget.id,
        categoryName: budget.category.name,
        consumedPct: budget.consumedPct,
        status: budget.status,
      }));

    const monthAssetsByName = new Map(
      assetsValueByMonth.map((item) => [item.month, item.value]),
    );
    const debtSeries = months.map((_month, index) => {
      const ratio = months.length > 1 ? index / (months.length - 1) : 1;
      return debtsValue * (1.02 - 0.02 * ratio);
    });
    const netWorthSeries = months.map((month, index) => {
      const date = new Date(`${month}-01T00:00:00`);
      date.setMonth(date.getMonth() + 1);
      date.setDate(0);
      const physicalAssets = monthAssetsByName.get(month) ?? assetsValue;
      const totalAssets = physicalAssets + positionsValue + accountsValue;
      const monthDebts = debtSeries[index] ?? debtsValue;
      return {
        date: toIsoDate(date),
        value: totalAssets - monthDebts,
        assets: totalAssets,
        debts: monthDebts,
      };
    });
    const seriesStart = netWorthSeries[0]?.value ?? netWorth;
    const assetsStart = netWorthSeries[0]?.assets ?? assetsValue;
    const debtsStart = debtSeries[0] ?? debtsValue;

    const categoryTotals = (from: string, to: string): Map<string, number> => {
      const totals = new Map<string, number>();
      for (const transaction of mockState.transactions) {
        if (
          transaction.userId !== user.id ||
          transaction.type !== "expense" ||
          transaction.date < from ||
          transaction.date > to ||
          !transaction.categoryId
        ) {
          continue;
        }
        totals.set(
          transaction.categoryId,
          (totals.get(transaction.categoryId) ?? 0) +
            convertCurrency(transaction.amount, transaction.currency, currency),
        );
      }
      return totals;
    };
    const previousCategoryTotals = categoryTotals(previous.from, previous.to);
    const categoryChanges = expensesByCategory
      .map((currentCategory) => {
        const previousValue =
          previousCategoryTotals.get(currentCategory.categoryId) ?? 0;
        return {
          categoryId: currentCategory.categoryId,
          name: currentCategory.name,
          current: currentCategory.value,
          previous: previousValue,
          deltaPct: pctDelta(currentCategory.value, previousValue),
        };
      })
      .sort(
        (first, second) =>
          Math.abs(second.current - second.previous) -
          Math.abs(first.current - first.previous),
      );

    const physicalByType = new Map(
      assetsComposition.map((item) => [item.type, item.value]),
    );
    const otherAssets = [...physicalByType.entries()]
      .filter(([type]) => type !== "property" && type !== "vehicle")
      .reduce((total, [, value]) => total + value, 0);
    const netWorthComposition = [
      {
        kind: "property" as const,
        label: "Propiedades",
        value: physicalByType.get("property") ?? 0,
      },
      {
        kind: "vehicle" as const,
        label: "Vehículos",
        value: physicalByType.get("vehicle") ?? 0,
      },
      { kind: "asset" as const, label: "Otros activos", value: otherAssets },
      {
        kind: "investment" as const,
        label: "Inversiones",
        value: positionsValue,
      },
      { kind: "account" as const, label: "Cuentas", value: accountsValue },
    ].filter((item) => item.value !== 0);

    return {
      period: { from: query.from, to: query.to },
      currency,
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
        assets: assetsValue,
        assetsDeltaPct: pctDelta(
          assetsValue,
          assetsStart - positionsValue - accountsValue,
        ),
        debts: debtsValue,
        debtsDeltaPct: pctDelta(debtsValue, debtsStart),
        accounts: accountsValue,
        accountsDeltaPct: null,
        investmentsDeltaPct:
          positionsCost > 0 ? (positionsProfit / positionsCost) * 100 : null,
      },
      netWorthSeries,
      assetsValueByMonth,
      incomeExpenseByMonth,
      expensesByCategory,
      categoryChanges,
      assetsComposition,
      netWorthComposition,
      cashflow: {
        income: incomeSources,
        expenses: expensesByCategory.map(({ name, color, value }) => ({
          name,
          color,
          value,
        })),
        savings: Math.max(0, current.savings),
      },
      investments: {
        totalValue: positionsValue,
        totalCost: positionsCost,
        profitLoss: positionsProfit,
        profitLossPct:
          positionsCost > 0 ? (positionsProfit / positionsCost) * 100 : 0,
        staleQuotes: derivedPositions.filter((position) => position.isStale)
          .length,
        positions: derivedPositions
          .map((position) => ({
            symbol: position.symbol,
            instrument: position.instrument,
            quantity: position.quantity,
            originalCurrency: position.currency,
            originalValue: position.currentValue ?? 0,
            originalCost: position.costBasis,
            originalProfitLoss: position.profitLoss,
            value: convertCurrency(
              position.currentValue ?? 0,
              position.currency,
              currency,
            ),
            profitLossPct: position.profitLossPct,
            isStale: position.isStale,
            quoteDate: position.quoteDate,
          }))
          .sort((a, b) => b.value - a.value),
      },
      budgetAlerts,
    };
  },
};

export type MockApi = typeof mockApi;
