import type {
  Account,
  Asset,
  Budget,
  Category,
  Conversation,
  Debt,
  Position,
  Quote,
  Transaction,
  User,
  Valuation,
} from "@/lib/api/types";
import { toIsoDate } from "@/lib/format";

export const EXPENSE_CATEGORY_COLORS: Record<string, string> = {
  food: "#ef4444",
  transport: "#3b82f6",
  housing: "#f59e0b",
  services: "#0ea5e9",
  entertainment: "#a855f7",
  other_expense: "#64748b",
};

export const BUDGET_WARNING_THRESHOLD = 0.8;
export const QUOTE_STALE_MS = 3_600_000;

export interface MockUserRecord {
  user: User;
  password: string;
}

export type StoredCategory = Category & { userId: string | null };
export type StoredAccount = Account & { userId: string };
export type StoredBudget = Budget & { userId: string };
export type StoredTransaction = Transaction & { userId: string };
export type StoredAsset = Asset & { userId: string };
export type StoredDebt = Debt & { userId: string };
export type StoredPosition = Position & { userId: string };
export type StoredConversation = Conversation & { userId: string };

export interface MockState {
  users: MockUserRecord[];
  accounts: StoredAccount[];
  categories: StoredCategory[];
  transactions: StoredTransaction[];
  budgets: StoredBudget[];
  assets: StoredAsset[];
  valuations: Valuation[];
  debts: StoredDebt[];
  positions: StoredPosition[];
  quotes: Quote[];
  conversations: StoredConversation[];
}

export const DEMO_EMAIL = "demo@atlassfin.app";
export const DEMO_PASSWORD = "Demo1234!";

const now = new Date();

const dayOfMonth = (offset: number, day: number): string =>
  toIsoDate(new Date(now.getFullYear(), now.getMonth() + offset, day));

const firstDayOfMonth = (offset: number): string => dayOfMonth(offset, 1);

const timestamp = (date: Date): string => date.toISOString();

export const mockId = (): string => crypto.randomUUID();

export const signedAmount = (transaction: Transaction): number => {
  if (transaction.type === "income") return transaction.amount;
  if (transaction.type === "expense") return -transaction.amount;
  return transaction.amount;
};

const systemCategory = (
  name: string,
  type: Category["type"],
  color: string,
): StoredCategory => ({
  id: mockId(),
  userId: null,
  name,
  type,
  color,
  icon: null,
  archived: false,
  isSystem: true,
});

const createInitialState = (): MockState => {
  const demoUser: User = {
    id: mockId(),
    name: "Demo",
    email: DEMO_EMAIL,
    baseCurrency: "ARS",
    theme: "system",
    aiEnabled: true,
    createdAt: timestamp(now),
  };

  const caja: StoredAccount = {
    id: mockId(),
    userId: demoUser.id,
    name: "Caja ARS",
    type: "cash",
    currency: "ARS",
    initialBalance: 50_000,
    currentBalance: 0,
    archived: false,
    notes: null,
    targetAmount: null,
    targetDate: null,
    sourceAccountId: null,
    createdAt: timestamp(now),
    updatedAt: timestamp(now),
  };
  const banco: StoredAccount = {
    id: mockId(),
    userId: demoUser.id,
    name: "Banco ARS",
    type: "bank",
    currency: "ARS",
    initialBalance: 300_000,
    currentBalance: 0,
    archived: false,
    notes: null,
    targetAmount: null,
    targetDate: null,
    sourceAccountId: null,
    createdAt: timestamp(now),
    updatedAt: timestamp(now),
  };
  const ahorroUsd: StoredAccount = {
    id: mockId(),
    userId: demoUser.id,
    name: "Ahorro USD",
    type: "wallet",
    currency: "USD",
    initialBalance: 1_000,
    currentBalance: 0,
    archived: false,
    notes: null,
    targetAmount: null,
    targetDate: null,
    sourceAccountId: null,
    createdAt: timestamp(now),
    updatedAt: timestamp(now),
  };
  const vacaciones: StoredAccount = {
    id: mockId(),
    userId: demoUser.id,
    name: "Vacaciones",
    type: "goal",
    currency: "ARS",
    initialBalance: 120_000,
    currentBalance: 0,
    archived: false,
    notes: null,
    targetAmount: 500_000,
    targetDate: firstDayOfMonth(6),
    sourceAccountId: banco.id,
    createdAt: timestamp(now),
    updatedAt: timestamp(now),
  };

  const userCategory = (
    name: string,
    type: Category["type"],
    color: string,
  ): StoredCategory => ({
    id: mockId(),
    userId: demoUser.id,
    name,
    type,
    color,
    icon: null,
    archived: false,
    isSystem: false,
  });

  const sueldo = userCategory("Sueldo", "income", "#22c55e");
  const freelance = userCategory("Freelance", "income", "#16a34a");
  const vivienda = userCategory("Vivienda", "expense", "#f59e0b");
  const comida = userCategory("Comida", "expense", "#ef4444");
  const transporte = userCategory("Transporte", "expense", "#3b82f6");
  const servicios = userCategory("Servicios", "expense", "#0ea5e9");
  const ocio = userCategory("Ocio", "expense", "#a855f7");
  const salud = userCategory("Salud", "expense", "#ec4899");
  const educacion = userCategory("Educación", "expense", "#8b5cf6");
  const compras = userCategory("Compras", "expense", "#64748b");
  const userCategories = [
    sueldo,
    freelance,
    vivienda,
    comida,
    transporte,
    servicios,
    ocio,
    salud,
    educacion,
    compras,
  ];

  const systemCategories: StoredCategory[] = [
    systemCategory("salary", "income", "#22c55e"),
    systemCategory("freelance", "income", "#16a34a"),
    systemCategory("other_income", "income", "#4ade80"),
    systemCategory("food", "expense", "#ef4444"),
    systemCategory("transport", "expense", "#3b82f6"),
    systemCategory("housing", "expense", "#f59e0b"),
    systemCategory("services", "expense", "#0ea5e9"),
    systemCategory("entertainment", "expense", "#a855f7"),
    systemCategory("other_expense", "expense", "#64748b"),
  ];

  const transactions: StoredTransaction[] = [];
  const MONTHS = [-5, -4, -3, -2, -1, 0];
  const SALARY = [880_000, 900_000, 920_000, 900_000, 950_000, 900_000];
  const FREELANCE = [0, 180_000, 0, 240_000, 0, 150_000];
  const RENT = 300_000;
  const FEES = [55_000, 60_000, 58_000, 65_000, 62_000, 60_000];
  const FOOD = [150_000, 168_000, 160_000, 185_000, 175_000, 180_000];
  const TRANSPORT = [40_000, 38_000, 45_000, 42_000, 47_000, 44_000];
  const SERVICES = [34_000, 36_000, 39_000, 42_000, 38_000, 40_000];
  const LEISURE = [52_000, 60_000, 45_000, 70_000, 58_000, 65_000];
  const HEALTH = [0, 25_000, 0, 30_000, 0, 20_000];
  const EDUCATION = [0, 0, 30_000, 0, 30_000, 0];
  const SHOPPING = [45_000, 60_000, 50_000, 20_000, 70_000, 95_000];
  const RESERVE = [100_000, 100_000, 0, 60_000, 120_000, 150_000];

  const split = (total: number, parts: number[]): number[] =>
    parts.map((part) => Math.round(total * part));

  for (let index = 0; index < MONTHS.length; index += 1) {
    const offset = MONTHS[index];
    const base = {
      userId: demoUser.id,
      currency: "ARS",
      notes: null,
      categoryId: null,
      createdAt: timestamp(now),
      updatedAt: timestamp(now),
      transferAccountId: null,
      transferGroupId: null,
    };

    const pushIncome = (
      amount: number,
      day: number,
      description: string,
      category: StoredCategory,
    ) => {
      if (amount <= 0) return;
      transactions.push({
        ...base,
        id: mockId(),
        type: "income",
        amount,
        date: dayOfMonth(offset, day),
        description,
        accountId: banco.id,
        categoryId: category.id,
      });
    };

    const pushExpense = (
      amount: number,
      day: number,
      description: string,
      account: StoredAccount,
      category: StoredCategory,
    ) => {
      if (amount <= 0) return;
      transactions.push({
        ...base,
        id: mockId(),
        type: "expense",
        amount,
        date: dayOfMonth(offset, day),
        description,
        accountId: account.id,
        categoryId: category.id,
      });
    };

    pushIncome(SALARY[index], 5, "Sueldo", sueldo);
    pushIncome(FREELANCE[index], 20, "Freelance", freelance);

    pushExpense(RENT, 3, "Alquiler", banco, vivienda);
    pushExpense(FEES[index], 8, "Expensas", banco, vivienda);

    const [foodA, foodB, foodC] = split(FOOD[index], [0.45, 0.25, 0.3]);
    pushExpense(foodA, 6, "Supermercado", caja, comida);
    pushExpense(foodB, 14, "Verdulería", caja, comida);
    pushExpense(foodC, 22, "Supermercado", banco, comida);

    const [fuel, transit] = split(TRANSPORT[index], [0.6, 0.4]);
    pushExpense(fuel, 5, "Nafta", banco, transporte);
    pushExpense(transit, 19, "SUBE", caja, transporte);

    const [internet, utilities] = split(SERVICES[index], [0.5, 0.5]);
    pushExpense(internet, 10, "Internet", banco, servicios);
    pushExpense(utilities, 12, "Luz y gas", banco, servicios);

    const [outing, streaming] = split(LEISURE[index], [0.7, 0.3]);
    pushExpense(outing, 18, "Salidas", banco, ocio);
    pushExpense(streaming, 27, "Streaming", banco, ocio);

    pushExpense(HEALTH[index], 13, "Farmacia", caja, salud);
    pushExpense(EDUCATION[index], 7, "Curso", banco, educacion);
    pushExpense(SHOPPING[index], 24, "Compras", banco, compras);

    if (offset === -3) {
      pushExpense(300_000, 21, "Reparaciones", banco, vivienda);
    }
    if (offset === -2) {
      pushExpense(320_000, 16, "Vacaciones", banco, ocio);
    }

    if (RESERVE[index] > 0) {
      const transferGroupId = mockId();
      transactions.push(
        {
          ...base,
          id: mockId(),
          type: "transfer",
          amount: -RESERVE[index],
          date: dayOfMonth(offset, 15),
          description: "Reserva mensual",
          accountId: banco.id,
          transferAccountId: caja.id,
          transferGroupId,
        },
        {
          ...base,
          id: mockId(),
          type: "transfer",
          amount: RESERVE[index],
          date: dayOfMonth(offset, 15),
          description: "Reserva mensual",
          accountId: caja.id,
          transferAccountId: banco.id,
          transferGroupId,
        },
      );
    }
  }

  const property: StoredAsset = {
    id: mockId(),
    userId: demoUser.id,
    name: "Departamento",
    type: "property",
    currency: "ARS",
    currentValue: 0,
    valuationDate: firstDayOfMonth(0),
    archived: false,
    notes: null,
    debtId: null,
    createdAt: timestamp(now),
    updatedAt: timestamp(now),
  };
  const vehicle: StoredAsset = {
    id: mockId(),
    userId: demoUser.id,
    name: "Auto",
    type: "vehicle",
    currency: "ARS",
    currentValue: 0,
    valuationDate: firstDayOfMonth(0),
    archived: false,
    notes: null,
    debtId: null,
    createdAt: timestamp(now),
    updatedAt: timestamp(now),
  };

  const valuations: Valuation[] = [
    {
      id: mockId(),
      assetId: property.id,
      value: 85_000_000,
      currency: "ARS",
      date: firstDayOfMonth(-2),
      source: "manual",
      createdAt: timestamp(now),
    },
    {
      id: mockId(),
      assetId: property.id,
      value: 88_000_000,
      currency: "ARS",
      date: firstDayOfMonth(-1),
      source: "manual",
      createdAt: timestamp(now),
    },
    {
      id: mockId(),
      assetId: property.id,
      value: 90_000_000,
      currency: "ARS",
      date: firstDayOfMonth(0),
      source: "manual",
      createdAt: timestamp(now),
    },
    {
      id: mockId(),
      assetId: vehicle.id,
      value: 12_000_000,
      currency: "ARS",
      date: firstDayOfMonth(0),
      source: "manual",
      createdAt: timestamp(now),
    },
  ];

  const hipoteca: StoredDebt = {
    id: mockId(),
    userId: demoUser.id,
    name: "Hipoteca",
    type: "mortgage",
    balance: 45_000_000,
    currency: "ARS",
    date: firstDayOfMonth(0),
    archived: false,
    assetId: property.id,
    createdAt: timestamp(now),
    updatedAt: timestamp(now),
  };

  const budgets: StoredBudget[] = [
    { category: vivienda, limit: 380_000, recurring: true },
    { category: comida, limit: 150_000, recurring: true },
    { category: transporte, limit: 50_000, recurring: false },
    { category: ocio, limit: 80_000, recurring: false },
    { category: compras, limit: 120_000, recurring: false },
  ].map(({ category, limit, recurring }) => ({
    id: mockId(),
    userId: demoUser.id,
    categoryId: category.id,
    category: { id: category.id, name: category.name, color: category.color },
    period: firstDayOfMonth(0),
    limit,
    currency: "ARS",
    recurring,
    spent: 0,
    available: limit,
    consumedPct: 0,
    status: "available" as const,
  }));

  const positions: StoredPosition[] = [
    {
      id: mockId(),
      userId: demoUser.id,
      symbol: "BTC",
      instrument: "Bitcoin",
      quantity: 0.05,
      avgCost: 55_000,
      currency: "USD",
      currentPrice: null,
      currentValue: null,
      costBasis: 0,
      profitLoss: null,
      profitLossPct: null,
      quoteDate: null,
      quoteProvider: null,
      isStale: false,
    },
    {
      id: mockId(),
      userId: demoUser.id,
      symbol: "ETH",
      instrument: "Ethereum",
      quantity: 0.8,
      avgCost: 2_500,
      currency: "USD",
      currentPrice: null,
      currentValue: null,
      costBasis: 0,
      profitLoss: null,
      profitLossPct: null,
      quoteDate: null,
      quoteProvider: null,
      isStale: false,
    },
  ];

  const quotes: Quote[] = [
    {
      symbol: "BTC",
      price: 64_000,
      currency: "USD",
      provider: "coingecko",
      change24h: 1.8,
      fetchedAt: timestamp(new Date(Date.now() - 10 * 60 * 1000)),
      isStale: false,
    },
    {
      symbol: "ETH",
      price: 3_100,
      currency: "USD",
      provider: "coingecko",
      change24h: -0.5,
      fetchedAt: timestamp(new Date(Date.now() - 2 * 60 * 60 * 1000)),
      isStale: false,
    },
  ];

  const conversations: StoredConversation[] = [
    {
      id: mockId(),
      userId: demoUser.id,
      question: "¿En qué gasté más este mes?",
      answer:
        "Este mes tu mayor gasto fue en Vivienda, con 90.000 ARS registrados.",
      contextMeta: {
        period: { from: firstDayOfMonth(0), to: dayOfMonth(0, 28) },
        currency: "ARS",
        sources: ["transactions", "categories"],
      },
      createdAt: timestamp(now),
    },
    {
      id: mockId(),
      userId: demoUser.id,
      question: "¿Cómo evolucionó mi patrimonio?",
      answer:
        "Tu patrimonio neto se mantuvo estable, impulsado por la valuación del Departamento.",
      contextMeta: {
        period: { from: firstDayOfMonth(0), to: dayOfMonth(0, 28) },
        currency: "ARS",
        sources: ["assets", "valuations", "debts"],
      },
      createdAt: timestamp(now),
    },
  ];

  return {
    users: [{ user: demoUser, password: DEMO_PASSWORD }],
    accounts: [caja, banco, ahorroUsd, vacaciones],
    categories: [...systemCategories, ...userCategories],
    transactions,
    budgets,
    assets: [property, vehicle],
    valuations,
    debts: [hipoteca],
    positions,
    quotes,
    conversations,
  };
};

export let mockState: MockState = createInitialState();

export const resetMockState = (): void => {
  mockState = createInitialState();
};

export const findUserRecord = (userId: string): MockUserRecord | undefined =>
  mockState.users.find((record) => record.user.id === userId);

export const findUserByEmail = (email: string): MockUserRecord | undefined =>
  mockState.users.find(
    (record) => record.user.email.toLowerCase() === email.toLowerCase(),
  );

export const getCategoriesByIds = (ids: string[]): Map<string, Category> =>
  new Map(
    mockState.categories
      .filter((category) => ids.includes(category.id))
      .map((category) => [category.id, category]),
  );

export const getExchangeRatesToArs = (): Record<string, number> => ({
  ARS: 1,
  USD: 1_000,
  EUR: 1_100,
  BRL: 200,
  UYU: 25,
});

export const convertCurrency = (
  amount: number,
  from: string,
  to: string,
): number => {
  if (from === to) return amount;
  const rates = getExchangeRatesToArs();
  const fromRate = rates[from] ?? 1;
  const toRate = rates[to] ?? 1;
  return (amount * fromRate) / toRate;
};
